<script setup lang="ts">
  import { Icon } from '@iconify/vue';
  import { DiceRoller } from 'dice-roller-parser';
  import { clamp } from 'lodash-es';

  import { getFormattedFormula } from '@/shared/utils/roll';

  import ParticipantStatTile from './ParticipantStatTile.vue';

  const {
    current = undefined,
    max = 0,
    formula = '',
    disabled = false,
    isPlayer = false,
  } = defineProps<{
    /** Текущие хиты (нет записи — существо на полных, игрок — не задано). */
    current?: number;
    /** Максимум хитов из статблока (`0` — неизвестен / игрок). */
    max?: number;
    /** Формула броска хитов из статблока (например, `8к8 + 16`). */
    formula?: string;
    disabled?: boolean;
    /** Участник является игроком (всегда имеет интерактивные хиты). */
    isPlayer?: boolean;
  }>();

  const emit = defineEmits<{
    'change': [value: number];
    /** Новый максимум хитов, прокинутый по формуле статблока. */
    'set-max': [value: number];
  }>();

  const roller = new DiceRoller();

  /** Приводит русскую нотацию статблока (`8к8 + 16`) к формату роллера. */
  function formatFormula(value: string): string {
    return getFormattedFormula({ formula: value });
  }

  /** Проверяет, что формула хитов распознаётся роллером. */
  function validateFormula(value: string): boolean {
    if (!value) {
      return false;
    }

    try {
      roller.parse(formatFormula(value));

      return true;
    } catch {
      return false;
    }
  }

  /** Быстрые шаги урона/лечения в попапе. */
  const QUICK_STEPS = [-5, -1, 1, 5];

  /** Позиция живого значения — между уроном и лечением. */
  const QUICK_VALUE_INDEX = QUICK_STEPS.length / 2;

  const isOpen = ref(false);

  const isKnown = computed(() => max > 0);

  const isInteractive = computed(() => isKnown.value || isPlayer);

  const currentValue = computed(() => {
    if (isKnown.value) {
      return current ?? max;
    }

    return current ?? 0;
  });

  const display = computed(() => {
    if (isKnown.value) {
      return `${currentValue.value}/${max}`;
    }

    return current !== undefined ? String(current) : '—';
  });

  // Остаток окрашивает значение существ: ноль — error, половина и меньше — warning.
  // Для игроков окрашиваем в error только при достижении 0.
  const valueClass = computed(() => {
    if (currentValue.value <= 0 && (isKnown.value || current !== undefined)) {
      return 'hp-control__value--danger';
    }

    if (isKnown.value && currentValue.value * 2 <= max) {
      return 'hp-control__value--warning';
    }

    return '';
  });

  const draft = ref('');

  // Черновик точного значения следует за актуальными хитами, пока попап
  // открыт: быстрые шаги меняют хиты тут же, и устаревший черновик по «ОК»
  // молча откатил бы их.
  watch([() => isOpen.value, currentValue], ([open, value]) => {
    if (open) {
      draft.value = String(value);
    }
  });

  /** Ввод хитов: `58` — установить точное значение, `+7`/`-6` — сдвинуть. */
  const DRAFT_PATTERN = /^([+-])?(\d+)$/;

  /**
   * Быстрый шаг урона/лечения — применяется сразу, попап остаётся открытым.
   * @param delta Смещение хитов (отрицательное — урон).
   */
  function applyStep(delta: number): void {
    if (isKnown.value) {
      emit('change', clamp(currentValue.value + delta, 0, max));
    } else {
      emit('change', Math.max(0, currentValue.value + delta));
    }
  }

  /**
   * Подпись быстрого шага со знаком: `-5`, `+1`.
   * @param delta Смещение хитов.
   */
  function stepLabel(delta: number): string {
    return delta > 0 ? `+${delta}` : String(delta);
  }

  // Автоселект значения при фокусе поля: новый ввод сразу затирает текущее
  // число. Выделение из обработчика focus браузер схлопывает последующим
  // mouseup, поэтому при фокусе мышью повторяем выделение на первом click.
  let selectOnClick = false;

  /**
   * Выделяет всё содержимое поля ввода — цели события.
   * @param event Событие фокуса или клика по полю.
   */
  function selectDraft(event: Event): void {
    const { target } = event;

    if (target instanceof HTMLInputElement) {
      target.select();
    }
  }

  /**
   * Выделяет значение при фокусе и взводит повтор для клика мышью.
   * @param event Событие фокуса поля.
   */
  function onDraftFocus(event: FocusEvent): void {
    selectOnClick = true;
    selectDraft(event);
  }

  /**
   * Повторяет выделение на первом клике после фокуса (см. `selectOnClick`).
   * @param event Событие клика по полю.
   */
  function onDraftClick(event: MouseEvent): void {
    if (selectOnClick) {
      selectOnClick = false;
      selectDraft(event);
    }
  }

  /**
   * Применяет введённое значение по `DRAFT_PATTERN`: без знака — точные хиты,
   * со знаком — сдвиг от текущих (`+7` — лечение, `-6` — урон). Невалидный
   * ввод закрывает попап без изменений.
   */
  function applyDraft(): void {
    isOpen.value = false;

    const match = DRAFT_PATTERN.exec(draft.value.trim());

    if (!match) {
      return;
    }

    const [, sign, digits] = match;
    const amount = Number(digits);

    const target = sign
      ? currentValue.value + (sign === '-' ? -amount : amount)
      : amount;

    const clamped = isKnown.value ? clamp(target, 0, max) : Math.max(0, target);

    if (clamped !== currentValue.value) {
      emit('change', clamped);
    }
  }

  // Кнопка броска видна, только когда формула статблока распознаётся роллером.
  const isFormulaRollable = computed(
    () => isKnown.value && Boolean(formula) && validateFormula(formula),
  );

  const rollTooltip = computed(() => `Бросить хиты: ${formula}`);

  /**
   * Прокидывает максимум хитов по формуле статблока: новый максимум и текущие
   * хиты устанавливаются в результат броска (минимум 1 — существо живо).
   */
  function rollMaxHitPoints(): void {
    isOpen.value = false;

    emit(
      'set-max',
      Math.max(1, Math.floor(roller.rollValue(formatFormula(formula)))),
    );
  }

  /** Восстанавливает полные хиты (доступно только при известном максимуме). */
  function restoreFull(): void {
    isOpen.value = false;

    if (isKnown.value && currentValue.value !== max) {
      emit('change', max);
    }
  }
</script>

<template>
  <div class="hp-control">
    <n-popover
      v-if="isInteractive"
      v-model:show="isOpen"
      trigger="click"
      placement="bottom"
      :show-arrow="false"
      raw
      :disabled="disabled"
    >
      <template #trigger>
        <!-- Триггер — плитка хитов: клик открывает попап урона/лечения. -->
        <button
          type="button"
          class="hp-control__trigger"
          :disabled="disabled"
          aria-label="Изменить хиты"
        >
          <participant-stat-tile
            label="Хиты"
            class="hp-control__tile"
          >
            <span :class="valueClass">{{ display }}</span>
          </participant-stat-tile>
        </button>
      </template>

      <div class="hp-control__popup">
        <!-- Быстрые шаги: урон слева, лечение справа, между ними живое
             значение. Применяются сразу, попап не закрывается. -->
        <div class="hp-control__steps">
          <template
            v-for="(step, index) in QUICK_STEPS"
            :key="step"
          >
            <span
              v-if="index === QUICK_VALUE_INDEX"
              class="hp-control__live"
            >
              {{ display }}
            </span>

            <n-button
              size="small"
              secondary
              :type="step < 0 ? 'error' : 'success'"
              @click="applyStep(step)"
            >
              {{ stepLabel(step) }}
            </n-button>
          </template>
        </div>

        <div
          v-if="isKnown"
          class="hp-control__full-row"
        >
          <n-button
            secondary
            type="success"
            class="hp-control__full"
            @click="restoreFull"
          >
            <template #icon>
              <icon icon="tabler:heart-plus" />
            </template>
            Полные хиты
          </n-button>

          <!-- Бросок максимума по формуле статблока. -->
          <n-tooltip
            v-if="isFormulaRollable"
            trigger="hover"
          >
            <template #trigger>
              <n-button
                secondary
                type="success"
                aria-label="Бросить хиты по формуле статблока"
                @click="rollMaxHitPoints"
              >
                <template #icon>
                  <icon icon="tabler:dice-5" />
                </template>
              </n-button>
            </template>

            {{ rollTooltip }}
          </n-tooltip>
        </div>

        <div class="hp-control__divider">
          <span class="hp-control__divider-label">
            Точное значение, + или -
          </span>

          <div class="hp-control__divider-line" />
        </div>

        <div class="hp-control__exact">
          <n-input
            v-model:value="draft"
            class="hp-control__input"
            aria-label="Текущие хиты или сдвиг"
            @focus="onDraftFocus"
            @click="onDraftClick"
            @keydown.enter.prevent="applyDraft"
          />

          <n-button
            secondary
            @click="applyDraft"
          >
            ОК
          </n-button>
        </div>
      </div>
    </n-popover>

    <!-- Хиты неизвестны (игрок / детальник ещё грузится) — статичная плитка. -->
    <participant-stat-tile
      v-else
      label="Хиты"
      class="hp-control__tile"
    >
      —
    </participant-stat-tile>
  </div>
</template>

<style scoped lang="scss">
  .hp-control {
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
      transition: border-color 0.15s ease-in-out;
    }

    &__trigger:not(:disabled):hover &__tile {
      border-color: var(--border-hover);
    }

    &__value--danger {
      color: var(--error);
    }

    &__value--warning {
      color: var(--warning);
    }

    &__popup {
      display: flex;
      flex-direction: column;
      gap: 12px;

      width: 256px;
      padding: 12px;

      background-color: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    &__steps {
      display: flex;
      gap: 6px;
      align-items: center;
      justify-content: center;
    }

    &__live {
      min-width: 56px;

      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--text-color-title);
      text-align: center;
    }

    &__full-row {
      display: flex;
      gap: 8px;
    }

    &__full {
      flex: 1 1 auto;
      justify-content: center;
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

    &__exact {
      display: flex;
      gap: 8px;
    }

    &__input {
      flex: 1 1 auto;

      :deep(.n-input__input-el) {
        text-align: center;
      }
    }
  }
</style>
