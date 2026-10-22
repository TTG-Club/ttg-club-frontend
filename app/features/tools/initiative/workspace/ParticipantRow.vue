<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { TrackerParticipant, UpdateParticipantRequest } from '../model';

  import { formatModifier } from '~bestiary/model';

  import { TrackerNameModal } from '../dialogs';
  import {
    getCreatureRoute,
    getParticipantTypeLabel,
    INITIATIVE_ICON,
    INITIATIVE_LIMIT,
    INITIATIVE_TEXT,
    PARTICIPANT_TYPE_META,
  } from '../model';
  import ParticipantRollControl from './ParticipantRollControl.vue';

  /** Пауза перед сохранением бонуса, пока его щёлкают стрелками. */
  const BONUS_SAVE_DELAY_MS = 500;

  /**
   * Участник боя: порядок, имя, бонус и инициатива. В подготовке бонус
   * правится, в бою участника можно отметить поверженным.
   */
  const {
    participant,
    order,
    isCombat = false,
    isCurrent = false,
    isDisabled = false,
  } = defineProps<{
    participant: TrackerParticipant;
    order: number;
    /** Идёт бой: бонус только для чтения. */
    isCombat?: boolean;
    isCurrent?: boolean;
    isDisabled?: boolean;
  }>();

  const emit = defineEmits<{
    'edit': [id: string, patch: UpdateParticipantRequest];
    'remove': [id: string];
    'roll': [id: string];
    'toggle-dead': [id: string, isDead: boolean];
  }>();

  const isRenameOpen = ref(false);

  const bonus = ref(participant.initiativeBonus);

  const typeMeta = computed(() => PARTICIPANT_TYPE_META[participant.type]);

  const typeLabel = computed(() => getParticipantTypeLabel(participant));

  const bonusLabel = computed(() =>
    formatModifier(participant.initiativeBonus),
  );

  const creatureRoute = computed(() =>
    participant.creatureUrl
      ? getCreatureRoute(participant.creatureUrl)
      : undefined,
  );

  const rowClass = computed(() => {
    if (isCombat && participant.dead) {
      return 'opacity-60';
    }

    return isCurrent
      ? 'border-primary bg-primary/10 ring-1 ring-primary'
      : undefined;
  });

  const nameClass = computed(() =>
    participant.dead ? 'line-through' : undefined,
  );

  const menuItems = computed<Array<Array<DropdownMenuItem>>>(() => {
    const items: Array<DropdownMenuItem> = [
      {
        label: INITIATIVE_TEXT.rename,
        icon: INITIATIVE_ICON.rename,
        onSelect: openRename,
      },
    ];

    if (isCombat) {
      items.push(
        participant.dead
          ? {
              label: INITIATIVE_TEXT.revive,
              icon: INITIATIVE_ICON.revive,
              color: 'success',
              onSelect: toggleDead,
            }
          : {
              label: INITIATIVE_TEXT.kill,
              icon: INITIATIVE_ICON.kill,
              color: 'error',
              onSelect: toggleDead,
            },
      );
    }

    return [
      items,
      [
        {
          label: INITIATIVE_TEXT.removeParticipant,
          icon: INITIATIVE_ICON.remove,
          color: 'error',
          onSelect: remove,
        },
      ],
    ];
  });

  // Ответ бэкенда приносит новый бонус — показываем его. Цикла с сохранением
  // ниже нет: значение с сервера равно сохранённому, и запрос не уходит.
  watch(
    () => participant.initiativeBonus,
    (value) => {
      bonus.value = value;
    },
  );

  watchDebounced(
    bonus,
    (value) => {
      if (
        typeof value === 'number'
        && Number.isFinite(value)
        && value !== participant.initiativeBonus
      ) {
        emit('edit', participant.id, { initiativeBonus: value });
      }
    },
    { debounce: BONUS_SAVE_DELAY_MS },
  );

  function openRename(): void {
    isRenameOpen.value = true;
  }

  /**
   * Сохраняет новое имя.
   * @param name - новое имя
   */
  function rename(name: string): void {
    emit('edit', participant.id, { name });
  }

  function toggleDead(): void {
    emit('toggle-dead', participant.id, !participant.dead);
  }

  function remove(): void {
    emit('remove', participant.id);
  }

  function roll(): void {
    emit('roll', participant.id);
  }

  /**
   * Ставит своё значение к20.
   * @param value - выпавшее на кости
   */
  function setRoll(value: number): void {
    emit('edit', participant.id, { initiativeRoll: value });
  }
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-xl border border-default bg-elevated/50 p-3"
    :class="rowClass"
  >
    <span class="w-6 shrink-0 text-center text-sm text-muted">
      {{ order }}
    </span>

    <UIcon
      :name="typeMeta.icon"
      class="size-5 shrink-0 text-muted"
    />

    <div class="flex min-w-0 flex-auto flex-col">
      <ULink
        v-if="creatureRoute"
        :to="creatureRoute"
        target="_blank"
        class="truncate text-highlighted"
        :class="nameClass"
      >
        {{ participant.name }}
      </ULink>

      <span
        v-else
        class="truncate text-highlighted"
        :class="nameClass"
      >
        {{ participant.name }}
      </span>

      <span class="truncate text-xs text-muted">{{ typeLabel }}</span>
    </div>

    <div class="flex shrink-0 flex-col items-center gap-0.5">
      <span class="text-xs text-muted">{{ INITIATIVE_TEXT.bonus }}</span>

      <span
        v-if="isCombat"
        class="text-highlighted"
      >
        {{ bonusLabel }}
      </span>

      <UInputNumber
        v-else
        v-model="bonus"
        :min="INITIATIVE_LIMIT.bonusMin"
        :max="INITIATIVE_LIMIT.bonusMax"
        :disabled="isDisabled"
        size="xs"
        class="w-24"
      />
    </div>

    <div class="flex shrink-0 flex-col items-center gap-0.5">
      <span class="text-xs text-muted">{{ INITIATIVE_TEXT.initiative }}</span>

      <ParticipantRollControl
        :participant="participant"
        :is-disabled="isDisabled"
        @roll="roll"
        @set-roll="setRoll"
      />
    </div>

    <UDropdownMenu :items="menuItems">
      <UButton
        :icon="INITIATIVE_ICON.menu"
        :aria-label="INITIATIVE_TEXT.actions"
        :disabled="isDisabled"
        color="neutral"
        variant="ghost"
      />
    </UDropdownMenu>

    <TrackerNameModal
      v-model:open="isRenameOpen"
      :title="INITIATIVE_TEXT.rename"
      :name="participant.name"
      :placeholder="INITIATIVE_TEXT.participantName"
      @save="rename"
    />
  </div>
</template>
