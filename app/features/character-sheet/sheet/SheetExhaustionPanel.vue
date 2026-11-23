<script setup lang="ts">
  import {
    EFFECT_EXHAUSTION_LEVELS,
    MAX_EXHAUSTION_LEVEL,
  } from '~active-effects/model';

  import { useCharacterSheet } from '../composables';
  import { EXHAUSTION_PANEL_LABELS, SHEET_TITLE_ACTION_CLASS } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /**
   * Истощение по таблице PHB 2014: шесть ступеней, следствия накапливаются,
   * на шестой персонаж умирает. Нажатие ставит ступень, повторное по текущей —
   * снимает её. Следствия применяет движок эффектов листа.
   */
  const { document, update } = useCharacterSheet();

  /**
   * Класс деления: набранные закрашены, смертельное — красным.
   * @param stepLevel - ступень деления
   * @param currentLevel - текущая ступень
   */
  function getStepClass(stepLevel: number, currentLevel: number): string {
    if (stepLevel > currentLevel) {
      return 'border-default text-muted hover:border-primary hover:text-primary';
    }

    return stepLevel === MAX_EXHAUSTION_LEVEL
      ? 'border-error bg-error/15 text-error'
      : 'border-primary bg-primary/15 text-primary';
  }

  const steps = computed(() =>
    EFFECT_EXHAUSTION_LEVELS.map((step) => ({
      level: step.level,
      hint: step.description,
      isFilled: step.level <= document.value.exhaustion,
      stepClass: getStepClass(step.level, document.value.exhaustion),
      label: `${EXHAUSTION_PANEL_LABELS.level} ${step.level}`,
    })),
  );

  const summary = computed(
    () =>
      EFFECT_EXHAUSTION_LEVELS.filter(
        (step) => step.level <= document.value.exhaustion,
      )
        .map((step) => step.description)
        .join(' ') || EXHAUSTION_PANEL_LABELS.none,
  );

  const summaryClass = computed(() => {
    if (document.value.exhaustion >= MAX_EXHAUSTION_LEVEL) {
      return 'text-error';
    }

    return document.value.exhaustion ? 'text-warning' : 'text-dimmed';
  });

  /**
   * Ставит ступень; нажатие по текущей снимает её.
   * @param level - ступень деления
   */
  function select(level: number): void {
    update((current) => ({
      ...current,
      exhaustion: current.exhaustion === level ? level - 1 : level,
    }));
  }
</script>

<template>
  <SheetPanel
    :title="EXHAUSTION_PANEL_LABELS.title"
    persistent-actions
  >
    <template #title-actions>
      <UPopover :ui="{ content: 'max-w-80 p-3' }">
        <button
          type="button"
          :class="SHEET_TITLE_ACTION_CLASS"
          :aria-label="EXHAUSTION_PANEL_LABELS.rules"
        >
          <UIcon
            name="tabler:info-circle-filled"
            class="size-3.5"
          />
        </button>

        <template #content>
          <div class="flex flex-col gap-2">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ EXHAUSTION_PANEL_LABELS.rules }}
            </span>

            <ul class="flex flex-col gap-1.5">
              <li
                v-for="step in steps"
                :key="step.level"
                class="flex gap-1.5 text-xs leading-relaxed text-toned"
              >
                <span class="font-bold text-primary">{{ step.level }}</span>

                <span>{{ step.hint }}</span>
              </li>
            </ul>

            <p class="text-xs text-muted">
              {{ EXHAUSTION_PANEL_LABELS.longRest }}
            </p>
          </div>
        </template>
      </UPopover>
    </template>

    <div class="flex flex-col gap-2 pt-1">
      <div class="grid grid-cols-6 gap-1">
        <UTooltip
          v-for="step in steps"
          :key="step.level"
          :text="step.hint"
        >
          <button
            type="button"
            class="flex h-7 w-full cursor-pointer items-center justify-center rounded-md border text-xs font-bold transition-colors"
            :class="step.stepClass"
            :aria-label="step.label"
            :aria-pressed="step.isFilled"
            @click.left.exact.prevent="select(step.level)"
          >
            {{ step.level }}
          </button>
        </UTooltip>
      </div>

      <p
        class="border-t border-default/50 pt-2 text-xs"
        :class="summaryClass"
      >
        {{ summary }}
      </p>
    </div>
  </SheetPanel>
</template>
