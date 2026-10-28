<script setup lang="ts">
  import { useBugReport } from '../composables';
  import { BUG_REPORT_ICON, BUG_REPORT_TEXT } from '../model';
  import { SelectionReportButton } from '../selection';

  /**
   * Кнопка баг-репорта на боковой панели. Окно открывают редко, поэтому оно
   * грузится отдельным чанком при первом открытии.
   */
  const BugReportModal = defineAsyncComponent(() =>
    import('../modal').then((module) => module.BugReportModal),
  );

  const { isOpen, openReport } = useBugReport();

  const isRequested = ref(false);

  watchImmediate(isOpen, (opened) => {
    if (opened) {
      isRequested.value = true;
    }
  });
</script>

<template>
  <UTooltip :text="BUG_REPORT_TEXT.open">
    <UButton
      :icon="BUG_REPORT_ICON.bug"
      :aria-label="BUG_REPORT_TEXT.open"
      color="neutral"
      variant="ghost"
      size="xl"
      @click.left.exact.prevent="openReport"
    />
  </UTooltip>

  <ClientOnly>
    <SelectionReportButton />

    <BugReportModal v-if="isRequested" />
  </ClientOnly>
</template>
