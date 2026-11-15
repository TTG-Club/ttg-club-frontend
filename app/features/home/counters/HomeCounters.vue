<script setup lang="ts">
  import { BUG_STATS_PATH } from '#shared/consts';
  import { bugStatsSchema } from '#shared/types';

  import {
    formatHomeCount,
    HOME_BUG_HUNTERS_DATA_KEY,
    HOME_COUNTERS_FIXED_ICON,
    HOME_COUNTERS_FIXED_LABEL,
    HOME_COUNTERS_MATERIALS_DATA_KEY,
    HOME_COUNTERS_MATERIALS_ICON,
    HOME_COUNTERS_MATERIALS_LABEL,
    HOME_COUNTERS_MATERIALS_PATH,
    parseHomeMaterialsCount,
  } from '../model';

  const api = useApi();

  /**
   * Строка счётчиков над заголовком шапки, как на new.ttg.club: сколько
   * материалов на этом сайте и сколько багов исправлено. Числа грузятся на
   * клиенте и не держат ответ главной; строка сразу стоит своей высотой,
   * поэтому шапка не прыгает, когда они приезжают.
   */
  const { data: materialsCount, status: materialsStatus } = useAsyncData(
    HOME_COUNTERS_MATERIALS_DATA_KEY,
    async () =>
      parseHomeMaterialsCount(await api(HOME_COUNTERS_MATERIALS_PATH)),
    { lazy: true, server: false },
  );

  // Та же статистика и тот же ключ, что у блока «Охотники за багами»:
  // запрос один на двоих. `dedupe: 'defer'` — второй читатель ждёт общего
  // запроса, а не отменяет его
  const { data: bugStats, status: bugStatsStatus } = useAsyncData(
    HOME_BUG_HUNTERS_DATA_KEY,
    async () => bugStatsSchema.parse(await api(BUG_STATS_PATH)),
    { lazy: true, server: false, dedupe: 'defer' },
  );

  // Счётчик, число которого не пришло (сбой или ответ без числа), из строки
  // убирается: «0 материалов» выглядело бы как правда, а не как сбой
  const counters = computed(() =>
    [
      {
        key: 'materials',
        icon: HOME_COUNTERS_MATERIALS_ICON,
        label: HOME_COUNTERS_MATERIALS_LABEL,
        count: materialsCount.value,
        status: materialsStatus.value,
      },
      {
        key: 'fixed',
        icon: HOME_COUNTERS_FIXED_ICON,
        label: HOME_COUNTERS_FIXED_LABEL,
        count: bugStats.value?.fixedCount,
        status: bugStatsStatus.value,
      },
    ]
      .map((counter) => ({
        key: counter.key,
        icon: counter.icon,
        label: counter.label,
        isLoading: counter.status === 'pending' || counter.status === 'idle',
        text: counter.count === undefined ? '' : formatHomeCount(counter.count),
      }))
      .filter((counter) => counter.isLoading || counter.text),
  );
</script>

<template>
  <!-- min-h держит место строки, даже если ни одно число не пришло: шапка
    сохраняет ритм -->
  <div
    class="flex min-h-4 flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-6"
  >
    <div
      v-for="counter in counters"
      :key="counter.key"
      class="group flex items-center gap-2"
    >
      <UIcon
        :name="counter.icon"
        class="size-4 shrink-0 text-dimmed transition-colors group-hover:text-primary"
      />

      <USkeleton
        v-if="counter.isLoading"
        class="h-4 w-10 rounded"
      />

      <span
        v-else
        class="font-mono text-sm leading-none font-semibold text-highlighted tabular-nums sm:text-base"
      >
        {{ counter.text }}
      </span>

      <!-- На телефоне подпись прячется, чтобы строка не распадалась на
        две, — но остаётся для скринридера -->
      <span
        class="sr-only font-mono text-[11px] leading-none tracking-[0.16em] text-dimmed uppercase sm:not-sr-only"
      >
        {{ counter.label }}
      </span>
    </div>
  </div>
</template>
