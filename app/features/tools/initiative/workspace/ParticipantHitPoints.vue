<script setup lang="ts">
  import { useDiceRoll } from '~dice-roller/composables';

  import {
    applyHitPointsInput,
    clampHitPoints,
    formatHitPointStep,
    getHitPointsTone,
    HIT_POINT_STEPS,
    INITIATIVE_ICON,
    INITIATIVE_TEXT,
  } from '../model';

  /** Цвет остатка хитов. */
  const TONE_CLASS = {
    error: 'text-error',
    warning: 'text-warning',
  } as const;

  /** Цвет кнопок урона и лечения. */
  const STEP_COLOR = {
    damage: 'error',
    heal: 'success',
  } as const;

  /**
   * Хиты участника: по клику урон и лечение шагами, точное значение или
   * сдвиг, полные хиты и бросок максимума по формуле статблока.
   */
  const {
    current = undefined,
    max = 0,
    formula = undefined,
    name,
    isPlayer = false,
    isDisabled = false,
  } = defineProps<{
    /** Записанные хиты; нет записи — существо на полных, у игрока пусто. */
    current?: number;
    /** Максимум хитов; `0` — неизвестен. */
    max?: number;
    /** Формула хитов из статблока. */
    formula?: string;
    /** Имя участника для истории бросков. */
    name: string;
    /** У игрока хиты задаются вручную, без максимума. */
    isPlayer?: boolean;
    isDisabled?: boolean;
  }>();

  const emit = defineEmits<{
    'change': [value: number];
    'set-max': [value: number];
  }>();

  const { roll } = useDiceRoll();

  const isOpen = ref(false);

  const draft = ref('');

  const isKnown = computed(() => max > 0);

  const isEditable = computed(() => isKnown.value || isPlayer);

  const hasValue = computed(() => isKnown.value || current !== undefined);

  const value = computed(() => current ?? max);

  const label = computed(() => {
    if (isKnown.value) {
      return `${value.value}/${max}`;
    }

    return current === undefined ? '—' : String(current);
  });

  const toneClass = computed(() => {
    const tone = hasValue.value
      ? getHitPointsTone(value.value, max)
      : undefined;

    return tone ? TONE_CLASS[tone] : undefined;
  });

  const steps = computed(() =>
    HIT_POINT_STEPS.map((delta) => ({
      delta,
      label: formatHitPointStep(delta),
      color: delta < 0 ? STEP_COLOR.damage : STEP_COLOR.heal,
    })),
  );

  const rollHint = computed(
    () => `${INITIATIVE_TEXT.rollHitPoints}: ${formula}`,
  );

  // Черновик идёт за хитами, пока окно открыто: шаги меняют хиты сразу, и
  // старый черновик откатил бы их по «ОК»
  watch([isOpen, value], ([open, hitPoints]) => {
    if (open) {
      draft.value = String(hitPoints);
    }
  });

  /**
   * Урон или лечение шагом, окно остаётся открытым.
   * @param delta - сдвиг хитов
   */
  function applyStep(delta: number): void {
    emit('change', clampHitPoints(value.value + delta, max));
  }

  function applyDraft(): void {
    isOpen.value = false;

    const next = applyHitPointsInput(draft.value, value.value, max);

    if (next !== undefined && next !== value.value) {
      emit('change', next);
    }
  }

  function restoreFull(): void {
    isOpen.value = false;

    if (value.value !== max) {
      emit('change', max);
    }
  }

  function rollMax(): void {
    if (!formula) {
      return;
    }

    isOpen.value = false;

    const outcome = roll({
      formula,
      label: `${INITIATIVE_TEXT.rollHitPoints}: ${name}`,
      source: INITIATIVE_TEXT.hitPointsSource,
    });

    if (outcome) {
      emit('set-max', Math.floor(outcome.value));
    }
  }

  /**
   * Выделяет число в поле, чтобы новый ввод сразу его заменил.
   * @param event - фокус поля
   */
  function selectDraft(event: FocusEvent): void {
    if (event.target instanceof HTMLInputElement) {
      event.target.select();
    }
  }
</script>

<template>
  <UPopover
    v-if="isEditable"
    v-model:open="isOpen"
  >
    <UButton
      :disabled="isDisabled"
      :aria-label="INITIATIVE_TEXT.changeHitPoints"
      color="neutral"
      variant="subtle"
      class="min-w-16 justify-center font-semibold tabular-nums"
    >
      <span :class="toneClass">{{ label }}</span>
    </UButton>

    <template #content>
      <div class="flex w-64 flex-col gap-3 p-3">
        <div class="flex items-center justify-between gap-1">
          <UButton
            v-for="step in steps"
            :key="step.delta"
            :label="step.label"
            :color="step.color"
            variant="subtle"
            size="sm"
            class="flex-auto justify-center tabular-nums"
            @click.left.exact.prevent="applyStep(step.delta)"
          />
        </div>

        <div
          v-if="isKnown"
          class="flex gap-2"
        >
          <UButton
            :label="INITIATIVE_TEXT.fullHitPoints"
            :icon="INITIATIVE_ICON.heal"
            color="success"
            variant="subtle"
            class="flex-auto justify-center"
            @click.left.exact.prevent="restoreFull"
          />

          <UTooltip
            v-if="formula"
            :text="rollHint"
          >
            <UButton
              :icon="INITIATIVE_ICON.rollAll"
              :aria-label="INITIATIVE_TEXT.rollHitPoints"
              color="success"
              variant="subtle"
              @click.left.exact.prevent="rollMax"
            />
          </UTooltip>
        </div>

        <form
          class="flex items-end gap-2"
          @submit.prevent="applyDraft"
        >
          <UFormField
            :label="INITIATIVE_TEXT.hitPointsInput"
            class="flex-auto"
          >
            <UInput
              v-model="draft"
              inputmode="numeric"
              class="w-full"
              @focus="selectDraft"
            />
          </UFormField>

          <UButton
            type="submit"
            :label="INITIATIVE_TEXT.ok"
            color="neutral"
            variant="subtle"
          />
        </form>
      </div>
    </template>
  </UPopover>

  <span
    v-else
    class="flex h-8 min-w-16 items-center justify-center text-muted"
  >
    —
  </span>
</template>
