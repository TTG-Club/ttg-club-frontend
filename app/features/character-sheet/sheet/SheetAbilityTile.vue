<script setup lang="ts">
  import type { AbilityKey } from '../model';

  import { useCharacterSheet } from '../composables';
  import {
    ABILITY_LABELS,
    ABILITY_SCORE,
    formatModifier,
    getAbilityModifier,
    LONG_PRESS_DELAY,
    SHEET_BODY_LABELS,
    SHEET_TITLE_ACTION_CLASS,
    SHEET_TITLE_ACTION_REVEAL_CLASS,
  } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /**
   * Плитка характеристики, как на new.ttg.club: крупный модификатор (клик —
   * проверка), значение на плашке у нижней грани с быстрой правкой ± и
   * шестерёнка точной правки (на сенсорном экране — долгое нажатие). Значение с прибавкой эффекта выделено.
   */
  const ADJUST_BUTTON_CLASSES =
    'rounded-full border border-primary/60 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100';

  const {
    abilityKey,
    score,
    baseScore,
    hint = '',
  } = defineProps<{
    abilityKey: AbilityKey;
    /** Значение с эффектами. */
    score: number;
    /** Записанное значение. */
    baseScore: number;
    /** Подсказка: откуда прибавка (раса, черта, эффект). */
    hint?: string;
  }>();

  const emit = defineEmits<{
    roll: [event: MouseEvent];
    settings: [];
    adjust: [delta: number];
  }>();

  const { editControlClass, isLocked, highlightedAbility } =
    useCharacterSheet();

  const panelRef = useTemplateRef('panel');

  // Флаг гасит клик, который браузер шлёт после долгого удержания: вместе с
  // окном правки не должна идти проверка характеристики
  let isLongPressTriggered = false;

  // Наведение или фокус подсвечивает навыки этой характеристики. Через
  // `unrefElement`: ref смотрит на компонент рамки, а слушателям нужен его
  // корневой элемент
  const panelElement = computed(() => unrefElement(panelRef));
  const isHovered = useElementHover(panelElement);
  const { focused: isFocusWithin } = useFocusWithin(panelElement);

  watch([isHovered, isFocusWithin], ([hovered, focused]) => {
    if (hovered || focused) {
      highlightedAbility.value = abilityKey;
    } else if (highlightedAbility.value === abilityKey) {
      highlightedAbility.value = null;
    }
  });

  onLongPress(
    panelRef,
    () => {
      if (isLocked.value) {
        return;
      }

      isLongPressTriggered = true;
      emit('settings');
    },
    { delay: LONG_PRESS_DELAY },
  );

  /**
   * Проверка характеристики, если клик не завершал долгое удержание.
   * @param event - клик
   */
  function roll(event: MouseEvent): void {
    if (isLongPressTriggered) {
      isLongPressTriggered = false;

      return;
    }

    emit('roll', event);
  }

  const label = computed(() => ABILITY_LABELS[abilityKey]);

  const modifierLabel = computed(() =>
    formatModifier(getAbilityModifier(score)),
  );

  const scoreClass = computed(() =>
    score === baseScore
      ? 'border-default/50 bg-default text-muted'
      : 'border-primary/60 bg-primary/15 text-primary',
  );
</script>

<template>
  <UTooltip :text="hint ? `${label.name} · ${hint}` : label.name">
    <SheetPanel
      ref="panel"
      :title="label.short"
      center-title
      interactive
      class="group w-full"
    >
      <template #title-actions>
        <button
          type="button"
          class="relative z-10"
          :class="[
            SHEET_TITLE_ACTION_CLASS,
            SHEET_TITLE_ACTION_REVEAL_CLASS,
            editControlClass,
          ]"
          :aria-label="`${SHEET_BODY_LABELS.settings}: ${label.name}`"
          @click.left.exact.prevent.stop="emit('settings')"
        >
          <UIcon
            name="tabler:settings"
            class="size-3.5"
          />
        </button>
      </template>

      <button
        type="button"
        class="flex w-full cursor-pointer items-center justify-center pt-1 pb-2 after:absolute after:inset-0 after:cursor-pointer"
        :aria-label="`${SHEET_BODY_LABELS.roll}: ${label.name}`"
        @click.left.prevent="roll"
      >
        <span class="text-3xl leading-none font-bold text-highlighted">
          {{ modifierLabel }}
        </span>
      </button>

      <div
        class="absolute -bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1"
      >
        <UButton
          icon="tabler:minus"
          color="neutral"
          variant="soft"
          size="xs"
          square
          :disabled="baseScore <= ABILITY_SCORE.min"
          :class="[ADJUST_BUTTON_CLASSES, editControlClass]"
          :aria-label="`${SHEET_BODY_LABELS.quantityDecrease}: ${label.name}`"
          @click.left.exact.prevent.stop="emit('adjust', -1)"
        />

        <span
          class="pointer-events-none rounded-full border px-2 py-0.5 text-xs leading-none font-medium"
          :class="scoreClass"
        >
          {{ score }}
        </span>

        <UButton
          icon="tabler:plus"
          color="neutral"
          variant="soft"
          size="xs"
          square
          :disabled="baseScore >= ABILITY_SCORE.max"
          :class="[ADJUST_BUTTON_CLASSES, editControlClass]"
          :aria-label="`${SHEET_BODY_LABELS.quantityIncrease}: ${label.name}`"
          @click.left.exact.prevent.stop="emit('adjust', 1)"
        />
      </div>
    </SheetPanel>
  </UTooltip>
</template>
