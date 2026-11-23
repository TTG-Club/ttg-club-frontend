<script setup lang="ts">
  import { SHEET_BODY_LABELS } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /**
   * Плитка показателя листа (мастерство, КД, инициатива): подпись на рамке и
   * крупное значение. Кликабельная плитка отдаёт `press`.
   */
  const {
    label,
    interactive = false,
    shortLabel = undefined,
    unit = undefined,
    pressLabel = undefined,
  } = defineProps<{
    label: string;
    value: string | number;
    unit?: string;
    /** Короткая подпись для узкой плитки («КД» вместо «Класс доспеха»). */
    shortLabel?: string;
    interactive?: boolean;
    /** Подпись действия для скринридера; по умолчанию — бросок. */
    pressLabel?: string;
  }>();

  const emit = defineEmits<{
    press: [event: MouseEvent];
  }>();

  const pressAriaLabel = computed(
    () => pressLabel ?? `${SHEET_BODY_LABELS.roll}: ${label}`,
  );
</script>

<template>
  <SheetPanel
    :title="label"
    :short-title="shortLabel"
    center-title
    :interactive="interactive"
  >
    <button
      v-if="interactive"
      type="button"
      class="flex w-full cursor-pointer items-center justify-center pt-1 after:absolute after:inset-0 after:cursor-pointer"
      :aria-label="pressAriaLabel"
      @click.left.prevent="emit('press', $event)"
    >
      <span class="text-2xl leading-none font-bold text-highlighted">
        {{ value }}

        <span
          v-if="unit"
          class="text-xs font-normal text-dimmed"
        >
          {{ unit }}
        </span>
      </span>
    </button>

    <div
      v-else
      class="flex items-center justify-center pt-1"
    >
      <span class="text-2xl leading-none font-bold text-highlighted">
        {{ value }}

        <span
          v-if="unit"
          class="text-xs font-normal text-dimmed"
        >
          {{ unit }}
        </span>
      </span>
    </div>
  </SheetPanel>
</template>
