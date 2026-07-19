<script setup lang="ts">
  import { Icon } from '@iconify/vue';

  import type {
    TrackerParticipant,
    UpdateParticipantRequest,
  } from '@/features/initiative/model';
  import { ConfirmDialog } from '@/features/initiative/ui-kit';

  import InitiativeReel from './InitiativeReel.vue';
  import InitiativeReelSkeleton from './InitiativeReelSkeleton.vue';
  import ParticipantRow from './ParticipantRow.vue';
  import TrackerAddPanel from './TrackerAddPanel.vue';

  const {
    participants,
    isActive = false,
    currentParticipantId = undefined,
    round,
    playerCount,
    creatureCount,
    canAddPlayer,
    canAddCreature,
    remainingCreatures,
    isMutating = false,
    currentHitPoints = undefined,
    maxHitPoints = undefined,
    armorClasses = undefined,
  } = defineProps<{
    participants: Array<TrackerParticipant>;
    isActive?: boolean;
    currentParticipantId?: string;
    round: number;
    playerCount: number;
    creatureCount: number;
    canAddPlayer: boolean;
    canAddCreature: boolean;
    remainingCreatures: number;
    isMutating?: boolean;
    currentHitPoints?: Record<string, number>;
    /** Прокинутые максимумы хитов (нет записи — среднее из статблока). */
    maxHitPoints?: Record<string, number>;
    /** КД игроков (нет записи — не задан). */
    armorClasses?: Record<string, number>;
  }>();

  const emit = defineEmits<{
    'add-player': [name: string, bonus: number];
    'add-creatures': [url: string, count: number, name?: string];
    'edit-participant': [id: string, patch: UpdateParticipantRequest];
    'remove-participant': [id: string];
    'roll-participant': [id: string];
    'toggle-dead': [id: string, dead: boolean];
    'set-hit-points': [id: string, value: number];
    'set-max-hit-points': [id: string, value: number];
    'set-armor-class': [id: string, value: number];
    'roll': [];
    'roll-creatures': [];
    'start': [];
    'next': [];
    'prev': [];
    'reset': [];
  }>();

  // Состояние блока добавления запоминается между настройкой и боем: по
  // умолчанию открыт в подготовке, дальше — как оставил пользователь.
  const isAddOpen = ref(!isActive);

  const isResetOpen = ref(false);

  const canStart = computed(() => participants.length > 0 && !isMutating);

  const canRollCreatures = computed(() => creatureCount > 0 && !isMutating);

  function isCurrent(participant: TrackerParticipant): boolean {
    return participant.id === currentParticipantId;
  }

  function onAddPlayer(name: string, bonus: number): void {
    emit('add-player', name, bonus);
  }

  function onAddCreatures(url: string, count: number, name?: string): void {
    emit('add-creatures', url, count, name);
  }

  function onEditParticipant(
    id: string,
    patch: UpdateParticipantRequest,
  ): void {
    emit('edit-participant', id, patch);
  }

  function onRemoveParticipant(id: string): void {
    emit('remove-participant', id);
  }

  function onRollParticipant(id: string): void {
    emit('roll-participant', id);
  }

  function onToggleDead(id: string, dead: boolean): void {
    emit('toggle-dead', id, dead);
  }

  function onSetHitPoints(id: string, value: number): void {
    emit('set-hit-points', id, value);
  }

  function onSetMaxHitPoints(id: string, value: number): void {
    emit('set-max-hit-points', id, value);
  }

  function onSetArmorClass(id: string, value: number): void {
    emit('set-armor-class', id, value);
  }

  function confirmReset(): void {
    isResetOpen.value = false;
    emit('reset');
  }
</script>

<template>
  <div class="tracker-board">
    <initiative-reel
      v-if="isActive"
      :participants="participants"
      :current-participant-id="currentParticipantId"
      :round="round"
    />

    <initiative-reel-skeleton v-else />

    <div
      v-if="isActive"
      class="tracker-board__controls"
    >
      <n-tooltip trigger="hover">
        <template #trigger>
          <n-button
            size="large"
            secondary
            :disabled="isMutating"
            aria-label="Предыдущий ход"
            @click="emit('prev')"
          >
            <template #icon>
              <icon icon="tabler:arrow-big-left-lines" />
            </template>
          </n-button>
        </template>

        Предыдущий ход
      </n-tooltip>

      <n-button
        class="tracker-board__primary"
        size="large"
        type="primary"
        :loading="isMutating"
        :disabled="isMutating"
        @click="emit('next')"
      >
        <template #icon>
          <icon icon="tabler:arrow-big-right-lines" />
        </template>
        Следующий ход
      </n-button>

      <n-tooltip trigger="hover">
        <template #trigger>
          <n-button
            size="large"
            secondary
            :disabled="isMutating"
            aria-label="Пересоздать бой"
            @click="isResetOpen = true"
          >
            <template #icon>
              <icon icon="tabler:restore" />
            </template>
          </n-button>
        </template>

        Пересоздать бой
      </n-tooltip>
    </div>

    <!-- Броски: на мобильном подписи прячутся (остаются иконки + aria-label),
         кнопка старта всегда с текстом. -->
    <div
      v-if="!isActive"
      class="tracker-board__controls"
    >
      <n-button
        size="large"
        type="primary"
        ghost
        :loading="isMutating"
        :disabled="!canStart"
        aria-label="Прокинуть инициативу всем"
        @click="emit('roll')"
      >
        <template #icon>
          <icon icon="tabler:dice-5" />
        </template>

        <span class="tracker-board__btn-label">Прокинуть всем</span>
      </n-button>

      <n-button
        size="large"
        type="primary"
        ghost
        :loading="isMutating"
        :disabled="!canRollCreatures"
        aria-label="Прокинуть инициативу существам"
        @click="emit('roll-creatures')"
      >
        <template #icon>
          <icon icon="tabler:paw" />
        </template>

        <span class="tracker-board__btn-label">Существам</span>
      </n-button>

      <n-button
        class="tracker-board__primary"
        size="large"
        type="primary"
        :loading="isMutating"
        :disabled="!canStart"
        @click="emit('start')"
      >
        <template #icon>
          <icon icon="tabler:swords" />
        </template>
        Начать бой
      </n-button>
    </div>

    <tracker-add-panel
      v-model:open="isAddOpen"
      :player-count="playerCount"
      :creature-count="creatureCount"
      :can-add-player="canAddPlayer"
      :can-add-creature="canAddCreature"
      :remaining-creatures="remainingCreatures"
      :is-mutating="isMutating"
      @add-player="onAddPlayer"
      @add-creatures="onAddCreatures"
    />

    <div
      v-if="participants.length"
      class="tracker-board__list"
    >
      <participant-row
        v-for="(participant, index) in participants"
        :key="participant.id"
        :participant="participant"
        :is-active="isActive"
        :is-current="isActive && isCurrent(participant)"
        :order="index + 1"
        :disabled="isMutating"
        :current-hit-points="currentHitPoints?.[participant.id]"
        :max-hit-points-override="maxHitPoints?.[participant.id]"
        :player-armor-class="armorClasses?.[participant.id]"
        @edit="onEditParticipant"
        @remove="onRemoveParticipant"
        @roll="onRollParticipant"
        @toggle-dead="onToggleDead"
        @set-hit-points="onSetHitPoints"
        @set-max-hit-points="onSetMaxHitPoints"
        @set-armor-class="onSetArmorClass"
      />
    </div>

    <div
      v-else
      class="tracker-board__empty"
    >
      Соберите отряд — добавьте игроков и существ бестиария.
    </div>

    <confirm-dialog
      v-model:open="isResetOpen"
      title="Пересоздать бой?"
      description="Броски очистятся, состав сохранится — трекер вернётся к подготовке."
      confirm-label="Пересоздать бой"
      confirm-color="warning"
      confirm-icon="tabler:restore"
      @confirm="confirmReset"
    />
  </div>
</template>

<style scoped lang="scss">
  .tracker-board {
    display: flex;
    flex-direction: column;
    gap: 20px;

    &__controls {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    &__primary {
      flex: 1 1 auto;
      justify-content: center;
    }

    &__btn-label {
      display: none;

      @include media-min($sm) {
        display: inline;
      }
    }

    &__list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    &__empty {
      padding: 32px;

      font-size: 14px;
      color: var(--text-g-color);
      text-align: center;

      border: 1px dashed var(--border);
      border-radius: 8px;
    }
  }
</style>
