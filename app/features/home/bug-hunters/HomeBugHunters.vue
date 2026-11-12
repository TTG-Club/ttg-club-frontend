<script setup lang="ts">
  import type { HomeBugHuntersPeriod } from '../model';

  import { BUG_STATS_PATH } from '#shared/consts';
  import { bugStatsSchema } from '#shared/types';

  import {
    getHomeSiteImageUrl,
    HOME_BUG_HUNTERS_BAR_DELAY_MS,
    HOME_BUG_HUNTERS_DATA_KEY,
    HOME_BUG_HUNTERS_EMPTY_MONTH_TEXT,
    HOME_BUG_HUNTERS_EMPTY_SLOT_TEXTS,
    HOME_BUG_HUNTERS_EMPTY_TEXT,
    HOME_BUG_HUNTERS_ERROR_TEXT,
    HOME_BUG_HUNTERS_HELP_ICON,
    HOME_BUG_HUNTERS_ICON,
    HOME_BUG_HUNTERS_LABEL,
    HOME_BUG_HUNTERS_PERIOD_DEFAULT,
    HOME_BUG_HUNTERS_PERIODS,
    HOME_BUG_HUNTERS_PODIUM_SIZE,
    HOME_BUG_HUNTERS_ROW_STAGGER_MS,
    HOME_BUG_HUNTERS_TOOLTIP,
    HOME_BUG_HUNTERS_TOP_SIZE,
    HOME_BUG_HUNTERS_TROPHY_ICON,
  } from '../model';
  import { HomePanel } from '../ui-kit';

  const api = useApi();

  /**
   * Рейтинг охотников за багами — тот же, что на new.ttg.club: десятка за
   * текущий месяц и за всё время. Грузится на клиенте: блок ниже первого
   * экрана и не должен держать ответ главной.
   */
  const { data: bugStats, status } = useAsyncData(
    HOME_BUG_HUNTERS_DATA_KEY,
    async () => bugStatsSchema.parse(await api(BUG_STATS_PATH)),
    { lazy: true, server: false },
  );

  const selectedPeriod = ref<HomeBugHuntersPeriod>(
    HOME_BUG_HUNTERS_PERIOD_DEFAULT,
  );

  // Изменяемая копия: UTabs не принимает неизменяемый список
  const periodItems = HOME_BUG_HUNTERS_PERIODS.map((period) => ({ ...period }));

  const allTimeFixers = computed(() => bugStats.value?.topFixers ?? []);

  const monthFixers = computed(() => bugStats.value?.topFixersThisMonth ?? []);

  /** Десятка выбранного периода; сервис уже отсортировал её и обрезал */
  const activeFixers = computed(() =>
    selectedPeriod.value === 'month' ? monthFixers.value : allTimeFixers.value,
  );

  const hasAnyFixers = computed(
    () => allTimeFixers.value.length > 0 || monthFixers.value.length > 0,
  );

  // idle тоже считаем загрузкой: при server: false до клиентского запроса
  // статус idle, и без этого на мгновение мелькала бы заглушка «пока никто»
  const isLoading = computed(
    () =>
      (status.value === 'pending' || status.value === 'idle')
      && !hasAnyFixers.value,
  );

  // Сбой не должен выглядеть как пустой рейтинг
  const placeholderText = computed(() =>
    status.value === 'error'
      ? HOME_BUG_HUNTERS_ERROR_TEXT
      : HOME_BUG_HUNTERS_EMPTY_TEXT,
  );

  /** Число багов у первого места — по нему меряются полоски остальных */
  const maxFixed = computed(() => activeFixers.value[0]?.fixed || 1);

  const rows = computed(() =>
    activeFixers.value.map((fixer, index) => {
      const isOnPodium = index < HOME_BUG_HUNTERS_PODIUM_SIZE;
      const rowDelay = index * HOME_BUG_HUNTERS_ROW_STAGGER_MS;

      const badgeColor: 'neutral' | 'success' = isOnPodium
        ? 'success'
        : 'neutral';

      return {
        name: fixer.name,
        fixed: String(fixer.fixed),
        avatarUrl: getHomeSiteImageUrl(fixer.avatarUrl),
        isWinner: index === 0,
        place: index + 1,
        rowStyle: { animationDelay: `${rowDelay}ms` },
        barClass: isOnPodium ? 'bg-success/8' : 'bg-success/4',
        barStyle: {
          width: `${(fixer.fixed / maxFixed.value) * 100}%`,
          animationDelay: `${HOME_BUG_HUNTERS_BAR_DELAY_MS + rowDelay}ms`,
        },
        badgeColor,
        nameClass: isOnPodium ? 'font-semibold text-default' : 'text-muted',
      };
    }),
  );

  /**
   * Свободные места до полной десятки: в начале месяца охотников мало, и
   * хвост дорисовывается заглушками, чтобы блок не выглядел пустым и не
   * менял высоту при переключении периода.
   */
  const emptySlots = computed(() => {
    const filledCount = activeFixers.value.length;
    const emptyCount = Math.max(HOME_BUG_HUNTERS_TOP_SIZE - filledCount, 0);

    return Array.from({ length: emptyCount }, (_, emptyIndex) => {
      const position = filledCount + emptyIndex;

      return {
        place: position + 1,
        label:
          HOME_BUG_HUNTERS_EMPTY_SLOT_TEXTS[
            emptyIndex % HOME_BUG_HUNTERS_EMPTY_SLOT_TEXTS.length
          ],
        rowStyle: {
          animationDelay: `${position * HOME_BUG_HUNTERS_ROW_STAGGER_MS}ms`,
        },
      };
    });
  });
</script>

<template>
  <HomePanel
    :label="HOME_BUG_HUNTERS_LABEL"
    :icon="HOME_BUG_HUNTERS_ICON"
  >
    <template #actions>
      <UTooltip :text="HOME_BUG_HUNTERS_TOOLTIP">
        <UIcon
          :name="HOME_BUG_HUNTERS_HELP_ICON"
          class="size-3.5 cursor-help text-dimmed transition-colors hover:text-default"
        />
      </UTooltip>
    </template>

    <!-- Скелетон повторяет переключатель и десять строк: лента не прыгает,
      когда рейтинг приедет -->
    <div
      v-if="isLoading"
      class="flex flex-col gap-2"
    >
      <USkeleton class="h-7 w-full rounded-md" />

      <div class="flex flex-col gap-1">
        <USkeleton
          v-for="index in HOME_BUG_HUNTERS_TOP_SIZE"
          :key="index"
          class="h-8.5 w-full rounded-lg"
        />
      </div>
    </div>

    <div
      v-else-if="hasAnyFixers"
      class="flex flex-col gap-2"
    >
      <!-- Табы — только переключатель периода, список рисуем сами. Длинный
        in-[…] гасит заливку активной вкладки до гидрации: пока бегунка нет,
        reka подсвечивает её сплошным цветом -->
      <UTabs
        v-model="selectedPeriod"
        :items="periodItems"
        :content="false"
        color="success"
        size="xs"
        :ui="{
          trigger:
            'flex-1 data-[state=active]:text-success in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:before:bg-success/15',
          indicator: 'bg-success/15 shadow-none',
        }"
      />

      <!-- Ключ по периоду: список пересоздаётся целиком, и появление
        отрабатывает у всех строк, а не только у новых имён -->
      <div
        v-if="rows.length"
        :key="selectedPeriod"
        class="flex flex-col gap-1"
      >
        <div
          v-for="row in rows"
          :key="row.name"
          class="relative flex items-center gap-2 rounded-lg border border-transparent px-2.5 py-1.5"
          :class="$style.row"
          :style="row.rowStyle"
        >
          <!-- Полоска на фоне строки: длина — доля от первого места.
            Вырастает через transform, вёрстка не пересчитывается -->
          <div
            class="absolute inset-y-0 left-0 origin-left rounded-lg"
            :class="[$style.bar, row.barClass]"
            :style="row.barStyle"
          />

          <div
            class="relative z-1 flex w-5 shrink-0 items-center justify-center"
          >
            <UIcon
              v-if="row.isWinner"
              :name="HOME_BUG_HUNTERS_TROPHY_ICON"
              class="size-4.5 text-legacy-warning"
            />

            <span
              v-else
              class="font-mono text-xs font-semibold text-dimmed tabular-nums"
            >
              {{ row.place }}
            </span>
          </div>

          <UAvatar
            :src="row.avatarUrl"
            :alt="row.name"
            size="2xs"
            class="relative z-1 shrink-0"
            :ui="{ fallback: 'uppercase' }"
          />

          <span
            class="relative z-1 flex-1 truncate text-sm"
            :class="row.nameClass"
          >
            {{ row.name }}
          </span>

          <UBadge
            :label="row.fixed"
            :color="row.badgeColor"
            variant="subtle"
            size="sm"
            class="relative z-1 font-mono tabular-nums"
          />
        </div>

        <!-- Свободные места. Пунктир — «места пока нет»; у настоящих строк
          рамка прозрачная, поэтому высота заглушки с ними совпадает -->
        <div
          v-for="slot in emptySlots"
          :key="slot.place"
          class="flex items-center gap-2 rounded-lg border border-dashed border-default px-2.5 py-1.5"
          :class="$style.row"
          :style="slot.rowStyle"
        >
          <div class="flex w-5 shrink-0 items-center justify-center">
            <span
              class="font-mono text-xs font-semibold text-dimmed tabular-nums"
            >
              {{ slot.place }}
            </span>
          </div>

          <!-- Пустое место под аватар: подписи стоят вровень с именами -->
          <span
            aria-hidden="true"
            class="size-5 shrink-0 rounded-full border border-dashed border-default"
          />

          <span class="flex-1 truncate text-sm text-dimmed italic">
            {{ slot.label }}
          </span>
        </div>
      </div>

      <p
        v-else
        class="rounded-lg border border-dashed border-default px-3 py-4 text-center text-xs text-muted"
      >
        {{ HOME_BUG_HUNTERS_EMPTY_MONTH_TEXT }}
      </p>
    </div>

    <p
      v-else
      class="rounded-lg border border-dashed border-default px-3 py-4 text-center text-xs text-muted"
    >
      {{ placeholderText }}
    </p>
  </HomePanel>
</template>

<style lang="scss" module>
  .row {
    animation: hunter-slide-in 0.4s ease-out both;
  }

  .bar {
    animation: hunter-bar-grow 0.6s ease-out both;
  }

  @keyframes hunter-slide-in {
    from {
      transform: translateX(-8px);
      opacity: 0;
    }

    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes hunter-bar-grow {
    from {
      transform: scaleX(0);
    }

    to {
      transform: scaleX(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .row,
    .bar {
      animation: none;
    }
  }
</style>
