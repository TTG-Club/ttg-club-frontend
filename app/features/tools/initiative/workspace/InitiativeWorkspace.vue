<script setup lang="ts">
  import type { DropdownMenuItem, TabsItem } from '@nuxt/ui';

  import type {
    AddParticipantRequest,
    UpdateParticipantRequest,
  } from '../model';

  import { SectionLayout } from '~section/layout';

  import {
    useCreatureSummaries,
    useParticipantStats,
    useTrackerSlot,
    useTrackerWorkspace,
  } from '../composables';
  import { TrackerConfirmModal, TrackerNameModal } from '../dialogs';
  import {
    createTracker,
    deleteTracker,
    getTrackerErrorMessage,
    getTrackerRoute,
    INITIATIVE_ICON,
    INITIATIVE_ROUTE,
    INITIATIVE_TEXT,
    isParticipantCurrent,
    TRACKER_STATUS_META,
  } from '../model';
  import CreatureAddForm from './CreatureAddForm.vue';
  import ParticipantRow from './ParticipantRow.vue';
  import PlayerAddForm from './PlayerAddForm.vue';
  import TrackerControls from './TrackerControls.vue';
  import TurnReel from './TurnReel.vue';

  const NOT_FOUND_STATUS = 404;
  const FORBIDDEN_STATUS = 403;

  /**
   * Бой: слева управление и добавление участников, справа участники в
   * порядке хода.
   */
  const { id } = defineProps<{
    id: string;
  }>();

  const toast = useToast();
  const { saveSlot, getAccessKey } = useTrackerSlot();

  const {
    tracker,
    isGuest,
    isLoading,
    isMutating,
    errorStatus,
    isActive,
    participants,
    canAddPlayer,
    remainingCreatures,
    hasCreatures,
    load,
    rename,
    addParticipant,
    editParticipant,
    removeParticipant,
    setDead,
    rollParticipant,
    rollAll,
    rollCreatures,
    start,
    next,
    previous,
    reset,
    destroy,
  } = useTrackerWorkspace(() => id);

  const { getSummary } = useCreatureSummaries(() => participants.value);

  const {
    hitPoints,
    maxHitPoints,
    armorClass,
    setHitPoints,
    setMaxHitPoints,
    setArmorClass,
  } = useParticipantStats(
    () => id,
    () => participants.value,
  );

  const avatars = computed<Record<string, string | undefined>>(() =>
    Object.fromEntries(
      participants.value.map((participant) => [
        participant.id,
        getSummary(participant)?.image,
      ]),
    ),
  );

  const isRenameOpen = ref(false);
  const isRemoveOpen = ref(false);
  const isReplaceOpen = ref(false);

  const addTabs: Array<TabsItem> = [
    {
      label: INITIATIVE_TEXT.addPlayer,
      icon: INITIATIVE_ICON.player,
      slot: 'player',
    },
    {
      label: INITIATIVE_TEXT.addCreature,
      icon: INITIATIVE_ICON.creature,
      slot: 'creature',
    },
  ];

  const title = computed(() => tracker.value?.name ?? INITIATIVE_TEXT.title);

  const status = computed(() =>
    tracker.value ? TRACKER_STATUS_META[tracker.value.status] : undefined,
  );

  const roundLabel = computed(
    () => `${INITIATIVE_TEXT.round} ${tracker.value?.round ?? 0}`,
  );

  const errorTitle = computed(() => {
    if (errorStatus.value === NOT_FOUND_STATUS) {
      return INITIATIVE_TEXT.notFound;
    }

    if (errorStatus.value === FORBIDDEN_STATUS) {
      return INITIATIVE_TEXT.forbidden;
    }

    return INITIATIVE_TEXT.loadFailed;
  });

  const removeDescription = computed(() =>
    isGuest.value ? INITIATIVE_TEXT.removeHard : INITIATIVE_TEXT.removeSoft,
  );

  const menuItems = computed<Array<DropdownMenuItem>>(() => {
    const items: Array<DropdownMenuItem> = isGuest.value
      ? [
          {
            label: INITIATIVE_TEXT.newGuestTracker,
            icon: INITIATIVE_ICON.newGuest,
            onSelect: openReplace,
          },
        ]
      : [
          {
            label: INITIATIVE_TEXT.rename,
            icon: INITIATIVE_ICON.rename,
            onSelect: openRename,
          },
        ];

    items.push({
      label: INITIATIVE_TEXT.remove,
      icon: INITIATIVE_ICON.remove,
      color: 'error',
      onSelect: openRemove,
    });

    return items;
  });

  watch(() => id, load, { immediate: true });

  function openRename(): void {
    isRenameOpen.value = true;
  }

  function openRemove(): void {
    isRemoveOpen.value = true;
  }

  function openReplace(): void {
    isReplaceOpen.value = true;
  }

  /**
   * Сохраняет новое имя трекера.
   * @param name - новое имя
   */
  function renameTracker(name: string): void {
    rename(name);
  }

  async function removeTracker(): Promise<void> {
    if (await destroy()) {
      await navigateTo(INITIATIVE_ROUTE);
    }
  }

  /**
   * Новый бой гостя вместо текущего: гостю доступен только один, поэтому
   * прежний удаляется. Его ключ берётся до того, как слот перезапишется.
   */
  async function replaceGuestTracker(): Promise<void> {
    const previousKey = getAccessKey(id);

    try {
      const created = await createTracker();

      if (!created.accessKey) {
        throw new Error(INITIATIVE_TEXT.errorNoKey);
      }

      saveSlot(created.id, created.accessKey);
      await deleteTracker(id, previousKey).catch(() => undefined);
      await navigateTo(getTrackerRoute(created.id));
    } catch (error) {
      toast.add({
        title: getTrackerErrorMessage(INITIATIVE_TEXT.errorCreate, error),
        color: 'error',
      });
    }
  }

  /**
   * Добавляет участника.
   * @param body - кого добавить
   */
  function add(body: AddParticipantRequest): void {
    addParticipant(body);
  }

  /**
   * Меняет участника.
   * @param participantId - идентификатор участника
   * @param patch - изменённые поля
   */
  function edit(participantId: string, patch: UpdateParticipantRequest): void {
    editParticipant(participantId, patch);
  }

  /**
   * Убирает участника.
   * @param participantId - идентификатор участника
   */
  function remove(participantId: string): void {
    removeParticipant(participantId);
  }

  /**
   * Прокидывает инициативу участнику.
   * @param participantId - идентификатор участника
   */
  function roll(participantId: string): void {
    rollParticipant(participantId);
  }

  /**
   * Отмечает участника поверженным или возвращает в бой.
   * @param participantId - идентификатор участника
   * @param isDead - повержен ли
   */
  function toggleDead(participantId: string, isDead: boolean): void {
    setDead(participantId, isDead);
  }

  /**
   * Сейчас ход этого участника.
   * @param participantId - идентификатор участника
   */
  function isCurrent(participantId: string): boolean {
    const participant = participants.value.find(
      (item) => item.id === participantId,
    );

    return (
      isActive.value
      && !!participant
      && isParticipantCurrent(participant, tracker.value?.currentParticipantId)
    );
  }
</script>

<template>
  <SectionLayout :title="title">
    <template #controls>
      <div
        v-if="tracker"
        class="flex flex-col gap-4"
      >
        <div class="flex items-center gap-2">
          <UButton
            v-if="!isGuest"
            :to="INITIATIVE_ROUTE"
            :icon="INITIATIVE_ICON.back"
            :aria-label="INITIATIVE_TEXT.back"
            color="neutral"
            variant="ghost"
          />

          <UBadge
            v-if="status"
            :label="tracker.statusName"
            :icon="status.icon"
            :color="status.color"
            variant="subtle"
          />

          <UBadge
            v-if="isActive"
            :label="roundLabel"
            color="neutral"
            variant="subtle"
          />

          <UDropdownMenu :items="menuItems">
            <UButton
              :icon="INITIATIVE_ICON.menu"
              :aria-label="INITIATIVE_TEXT.actions"
              :disabled="isMutating"
              color="neutral"
              variant="ghost"
              class="ml-auto"
            />
          </UDropdownMenu>
        </div>

        <TrackerControls
          :is-combat="isActive"
          :is-mutating="isMutating"
          :has-participants="participants.length > 0"
          :has-creatures="hasCreatures"
          @roll-all="rollAll"
          @roll-creatures="rollCreatures"
          @start="start"
          @previous="previous"
          @next="next"
          @reset="reset"
        />

        <UTabs
          :items="addTabs"
          :unmount-on-hide="false"
          color="neutral"
          variant="link"
          class="w-full"
        >
          <template #player>
            <PlayerAddForm
              :is-disabled="isMutating"
              :is-limited="!canAddPlayer"
              @add="add"
            />
          </template>

          <template #creature>
            <CreatureAddForm
              :is-disabled="isMutating"
              :remaining="remainingCreatures"
              @add="add"
            />
          </template>
        </UTabs>

        <TrackerNameModal
          v-model:open="isRenameOpen"
          :title="INITIATIVE_TEXT.renameTitle"
          :name="tracker.name"
          :placeholder="INITIATIVE_TEXT.namePlaceholder"
          @save="renameTracker"
        />

        <TrackerConfirmModal
          v-model:open="isRemoveOpen"
          :title="INITIATIVE_TEXT.removeTitle"
          :description="removeDescription"
          :confirm-label="INITIATIVE_TEXT.remove"
          :confirm-icon="INITIATIVE_ICON.remove"
          @confirm="removeTracker"
        />

        <TrackerConfirmModal
          v-model:open="isReplaceOpen"
          :title="INITIATIVE_TEXT.newGuestTitle"
          :description="INITIATIVE_TEXT.newGuestDescription"
          :confirm-label="INITIATIVE_TEXT.newGuestTracker"
          :confirm-icon="INITIATIVE_ICON.newGuest"
          color="warning"
          @confirm="replaceGuestTracker"
        />
      </div>
    </template>

    <div
      v-if="isLoading && !tracker"
      class="flex justify-center py-16 text-muted"
    >
      <UIcon
        :name="INITIATIVE_ICON.loading"
        class="size-6 animate-spin"
      />
    </div>

    <UEmpty
      v-else-if="errorStatus !== undefined"
      :icon="INITIATIVE_ICON.preparing"
      :title="errorTitle"
      variant="naked"
      class="py-16"
    >
      <template #actions>
        <UButton
          :to="INITIATIVE_ROUTE"
          :label="INITIATIVE_TEXT.title"
          color="neutral"
          variant="subtle"
        />

        <UButton
          :label="INITIATIVE_TEXT.retry"
          @click.left.exact.prevent="load"
        />
      </template>
    </UEmpty>

    <div
      v-else-if="participants.length"
      class="flex flex-col gap-2"
    >
      <TurnReel
        v-if="isActive && tracker"
        :participants="participants"
        :current-id="tracker.currentParticipantId"
        :round="tracker.round"
        :avatars="avatars"
        class="mb-2"
      />

      <ParticipantRow
        v-for="(participant, index) in participants"
        :key="participant.id"
        :participant="participant"
        :order="index + 1"
        :summary="getSummary(participant)"
        :hit-points="hitPoints[participant.id]"
        :max-hit-points="maxHitPoints[participant.id]"
        :armor-class="armorClass[participant.id]"
        :is-combat="isActive"
        :is-current="isCurrent(participant.id)"
        :is-disabled="isMutating"
        @edit="edit"
        @remove="remove"
        @roll="roll"
        @toggle-dead="toggleDead"
        @set-hit-points="setHitPoints"
        @set-max-hit-points="setMaxHitPoints"
        @set-armor-class="setArmorClass"
      />
    </div>

    <UEmpty
      v-else-if="tracker"
      :icon="INITIATIVE_ICON.creature"
      :title="INITIATIVE_TEXT.noParticipants"
      variant="naked"
      class="py-16"
    />
  </SectionLayout>
</template>
