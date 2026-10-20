<script setup lang="ts">
  import { Icon } from '@iconify/vue';
  import { useToast } from 'vue-toastification';

  import { ToastEventBus } from '@/shared/config';

  import {
    useInitiativeStorage,
    useTrackerWorkspace,
  } from '@/features/initiative/composables';
  import {
    createTracker,
    deleteTracker,
    getFetchStatus,
    getTrackerErrorMessage,
    INITIATIVE_TOOL_ROUTE,
  } from '@/features/initiative/model';

  import { TrackerBoard, TrackerHeader } from './ui';

  const { id } = defineProps<{
    id: string;
  }>();

  const router = useRouter();
  const toast = useToast(ToastEventBus);
  const { saveSlot, keyForTracker } = useInitiativeStorage();

  const {
    tracker,
    isAnonymous,
    isLoading,
    isMutating,
    loadError,
    isActive,
    participants,
    playerCount,
    creatureCount,
    canAddPlayer,
    canAddCreature,
    remainingCreatures,
    currentHitPoints,
    maxHitPoints,
    armorClasses,
    load,
    rename,
    addPlayer,
    addCreatures,
    editParticipant,
    deleteParticipant,
    setDead,
    rollParticipant,
    roll,
    rollCreatures,
    startCombat,
    advanceTurn,
    rewindTurn,
    reset,
    destroy,
    setHitPoints,
    setMaxHitPoints,
    setArmorClass,
  } = useTrackerWorkspace(() => id);

  onMounted(load);

  watch(
    () => id,
    () => {
      load();
    },
  );

  const errorStatus = computed(() => getFetchStatus(loadError.value));

  const errorResultStatus = computed<'404' | '403' | 'error'>(() => {
    switch (errorStatus.value) {
      case 404:
        return '404';
      case 403:
        return '403';
      default:
        return 'error';
    }
  });

  const errorTitle = computed(() => {
    switch (errorStatus.value) {
      case 404:
        return 'Трекер не найден';
      case 403:
        return 'Доступ к трекеру запрещён';
      case 401:
        return 'Требуется авторизация';
      default:
        return 'Не удалось загрузить трекер';
    }
  });

  function goToTool(): void {
    router.push(INITIATIVE_TOOL_ROUTE);
  }

  async function handleRemove(): Promise<void> {
    const isDeleted = await destroy();

    if (isDeleted) {
      router.push(INITIATIVE_TOOL_ROUTE);
    }
  }

  /**
   * Анонимная «замена» трекера: создаём новый, перезаписываем слот и лучшим
   * усилием удаляем старый (его ключ считываем до перезаписи слота).
   */
  async function handleReplace(): Promise<void> {
    const previousId = id;
    const previousKey = keyForTracker(previousId);

    try {
      const created = await createTracker();

      if (!created.accessKey) {
        toast.error(
          'Не удалось создать трекер. Сервер не вернул ключ доступа.',
        );

        return;
      }

      saveSlot(created.id, created.accessKey);

      try {
        await deleteTracker(previousId, previousKey);
      } catch (error) {
        console.error('Не удалось удалить прежний анонимный трекер:', error);
      }

      router.push(`${INITIATIVE_TOOL_ROUTE}/${created.id}`);
    } catch (error) {
      toast.error(
        `Не удалось создать трекер. ${getTrackerErrorMessage(error)}`,
      );
    }
  }

  /**
   * Авторизованный: собираем ещё один бой (в пределах лимита), не трогая
   * текущий, и сразу открываем его. Лимит держит бэк — при превышении покажем
   * ошибку тостом.
   */
  async function handleCreateAnother(): Promise<void> {
    try {
      const created = await createTracker();

      router.push(`${INITIATIVE_TOOL_ROUTE}/${created.id}`);
    } catch (error) {
      toast.error(
        `Не удалось создать трекер. ${getTrackerErrorMessage(error)}`,
      );
    }
  }
</script>

<template>
  <div class="tracker-workspace">
    <div
      v-if="isLoading && !tracker"
      class="tracker-workspace__loader"
    >
      <icon
        icon="tabler:loader-2"
        class="tracker-workspace__spinner"
      />
    </div>

    <template v-else-if="tracker">
      <tracker-header
        :tracker="tracker"
        :is-anonymous="isAnonymous"
        :is-mutating="isMutating"
        @rename="rename"
        @remove="handleRemove"
        @create-new="handleReplace"
        @create-another="handleCreateAnother"
      />

      <tracker-board
        :participants="participants"
        :is-active="isActive"
        :current-participant-id="tracker.currentParticipantId"
        :round="tracker.round"
        :player-count="playerCount"
        :creature-count="creatureCount"
        :can-add-player="canAddPlayer"
        :can-add-creature="canAddCreature"
        :remaining-creatures="remainingCreatures"
        :is-mutating="isMutating"
        :current-hit-points="currentHitPoints"
        :max-hit-points="maxHitPoints"
        :armor-classes="armorClasses"
        @add-player="addPlayer"
        @add-creatures="addCreatures"
        @edit-participant="editParticipant"
        @remove-participant="deleteParticipant"
        @roll-participant="rollParticipant"
        @toggle-dead="setDead"
        @set-hit-points="setHitPoints"
        @set-max-hit-points="setMaxHitPoints"
        @set-armor-class="setArmorClass"
        @roll="roll"
        @roll-creatures="rollCreatures"
        @start="startCombat"
        @next="advanceTurn"
        @prev="rewindTurn"
        @reset="reset"
      />
    </template>

    <n-result
      v-else
      :status="errorResultStatus"
      :title="errorTitle"
      :description="getTrackerErrorMessage(loadError)"
    >
      <template #footer>
        <div class="tracker-workspace__error-actions">
          <n-button
            type="primary"
            @click="load"
          >
            Обновить
          </n-button>

          <n-button
            secondary
            @click="goToTool"
          >
            Вернуться к инструменту
          </n-button>
        </div>
      </template>
    </n-result>
  </div>
</template>

<style scoped lang="scss">
  .tracker-workspace {
    display: flex;
    flex-direction: column;
    gap: 24px;

    &__loader {
      display: flex;
      justify-content: center;
      padding-block: 64px;
    }

    &__spinner {
      width: 32px;
      height: 32px;
      color: var(--text-g-color);
      animation: tracker-spin 1s linear infinite;
    }

    &__error-actions {
      display: flex;
      gap: 8px;
      justify-content: center;
    }
  }

  @keyframes tracker-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
