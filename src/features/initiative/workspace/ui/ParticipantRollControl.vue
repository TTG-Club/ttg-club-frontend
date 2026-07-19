<script setup lang="ts">
  import { Icon } from '@iconify/vue';
  import { clamp } from 'lodash-es';

  import type { TrackerParticipant } from '@/features/initiative/model';
  import {
    isParticipantRolled,
    MAX_D20,
    MIN_D20,
    rollD20,
  } from '@/features/initiative/model';

  import ParticipantStatTile from './ParticipantStatTile.vue';

  const { participant, disabled = false } = defineProps<{
    participant: TrackerParticipant;
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    'roll': [id: string];
    'set-roll': [id: string, roll: number];
  }>();

  const isOpen = ref(false);
  const rollDraft = ref(participant.initiativeRoll ?? MIN_D20);
  // Флаг «пользователь коснулся поля»: без него «ОК» без правки у ещё не
  // брошенного участника молча выставил бы бросок 1 (дефолт rollDraft).
  const isDraftDirty = ref(false);

  const isRolled = computed(() => isParticipantRolled(participant));

  const rollActionLabel = computed(() =>
    isRolled.value ? 'Перебросить' : 'Бросить (к20)',
  );

  const totalDisplay = computed(() =>
    typeof participant.initiativeTotal === 'number'
      ? String(participant.initiativeTotal)
      : '—',
  );

  // При открытии синхронизируем поле с текущим броском и сбрасываем «грязность».
  watch(isOpen, (open) => {
    if (open) {
      rollDraft.value = participant.initiativeRoll ?? MIN_D20;
      isDraftDirty.value = false;
    }
  });

  function onDraftInput(value: number | null): void {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return;
    }

    rollDraft.value = value;
    isDraftDirty.value = true;
  }

  function rollRandom(): void {
    isOpen.value = false;
    emit('roll', participant.id);
  }

  /**
   * Бросок с преимуществом/помехой: две к20 на клиенте, берём больший или
   * меньший. Результат уходит как ручной бросок (PUT `initiativeRoll`) —
   * отдельного эндпоинта на бэке для этого не нужно.
   * @param pickBest true — преимущество (больший), false — помеха (меньший).
   */
  function rollPair(pickBest: boolean): void {
    isOpen.value = false;

    const firstRoll = rollD20();
    const secondRoll = rollD20();

    const value = pickBest
      ? Math.max(firstRoll, secondRoll)
      : Math.min(firstRoll, secondRoll);

    emit('set-roll', participant.id, value);
  }

  function applyManual(): void {
    isOpen.value = false;

    // Нетронутое поле = не выставляем бросок (иначе «ОК» = бросок 1).
    if (!isDraftDirty.value) {
      return;
    }

    const clamped = clamp(rollDraft.value, MIN_D20, MAX_D20);

    if (clamped !== participant.initiativeRoll) {
      emit('set-roll', participant.id, clamped);
    }
  }
</script>

<template>
  <div class="roll-control">
    <n-popover
      v-model:show="isOpen"
      trigger="click"
      placement="bottom"
      :show-arrow="false"
      raw
      :disabled="disabled"
    >
      <template #trigger>
        <!-- Триггер — сама плитка итога инициативы. -->
        <button
          type="button"
          class="roll-control__trigger"
          :disabled="disabled"
          aria-label="Бросок инициативы"
        >
          <participant-stat-tile
            label="Иниц."
            accent
            class="roll-control__tile"
          >
            <template #label-icon>
              <icon
                icon="tabler:dice-5"
                class="roll-control__label-icon"
              />
            </template>

            <span
              :key="totalDisplay"
              class="roll-control__total"
            >
              {{ totalDisplay }}
            </span>
          </participant-stat-tile>
        </button>
      </template>

      <div class="roll-control__popup">
        <n-button
          type="primary"
          block
          @click="rollRandom"
        >
          <template #icon>
            <icon icon="tabler:dice-5" />
          </template>
          {{ rollActionLabel }}
        </n-button>

        <!-- Преимущество/помеха: две к20 фоном, берётся больший/меньший. -->
        <div class="roll-control__pair">
          <n-button
            secondary
            type="success"
            block
            @click="rollPair(true)"
          >
            <template #icon>
              <icon icon="tabler:chevrons-up" />
            </template>
            С преимуществом
          </n-button>

          <n-button
            secondary
            type="error"
            block
            @click="rollPair(false)"
          >
            <template #icon>
              <icon icon="tabler:chevrons-down" />
            </template>
            С помехой
          </n-button>
        </div>

        <div class="roll-control__divider">
          <span class="roll-control__divider-label">Или живые кости</span>

          <div class="roll-control__divider-line" />
        </div>

        <div class="roll-control__manual">
          <n-input-number
            :value="rollDraft"
            :min="MIN_D20"
            :max="MAX_D20"
            class="roll-control__input"
            aria-label="Значение d20"
            @update:value="onDraftInput"
          />

          <n-button
            secondary
            @click="applyManual"
          >
            ОК
          </n-button>
        </div>
      </div>
    </n-popover>
  </div>
</template>

<style scoped lang="scss">
  .roll-control {
    width: 100%;

    &__trigger {
      cursor: pointer;

      display: block;

      width: 100%;
      padding: 0;

      background: transparent;
      border: none;
      border-radius: 8px;

      transition: opacity 0.15s ease-in-out;

      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    }

    &__tile {
      width: 100%;
      transition: background-color 0.15s ease-in-out;
    }

    &__trigger:not(:disabled):hover &__tile {
      background-color: color-mix(in srgb, var(--primary) 20%, transparent);
    }

    &__label-icon {
      width: 12px;
      height: 12px;
    }

    &__popup {
      display: flex;
      flex-direction: column;
      gap: 12px;

      width: 224px;
      padding: 12px;

      background-color: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    &__pair {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    &__divider {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    &__divider-label {
      flex-shrink: 0;
      font-size: 12px;
      color: var(--text-g-color);
    }

    &__divider-line {
      flex: 1 1 auto;
      height: 1px;
      background-color: var(--border);
    }

    &__manual {
      display: flex;
      gap: 8px;
    }

    &__input {
      flex: 1 1 auto;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .roll-control__total {
      display: inline-block;
      animation: roll-total-pop 450ms ease-out;
    }
  }

  @keyframes roll-total-pop {
    0% {
      transform: scale(0.3);
      opacity: 0;
    }

    60% {
      transform: scale(1.2);
      opacity: 1;
    }

    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
