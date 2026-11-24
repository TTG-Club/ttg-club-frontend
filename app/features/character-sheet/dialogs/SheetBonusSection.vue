<script setup lang="ts">
  import type {
    CustomBonus,
    CustomBonusContext,
    CustomBonusSourceOption,
    SheetClass,
  } from '../model';

  import {
    CUSTOM_BONUS_FORMAT_OPTIONS,
    CUSTOM_BONUS_RANGE,
    formatModifier,
    getCustomBonusesTotal,
    SETTINGS_BASE_SOURCE,
    SHEET_SETTINGS_TEXT,
  } from '../model';
  import SheetCustomBonusRows from './SheetCustomBonusRows.vue';

  /**
   * Раздел показателя в настройках листа, как на new.ttg.club: плитки
   * основы (карандаш открывает выбор источника), суммы своих бонусов и
   * итога, под ними — строки своих бонусов. Устроен одинаково у бонуса
   * мастерства и у инициативы: разница в вариантах основы и подписях.
   */
  const {
    classes,
    context,
    title,
    baseItems,
    kinds,
    baseValue,
    totalLabel,
    hint,
  } = defineProps<{
    classes: ReadonlyArray<Pick<SheetClass, 'id' | 'name'>>;
    context: CustomBonusContext;
    title: string;
    /** Варианты основы: свои у мастерства и у инициативы. */
    baseItems: ReadonlyArray<CustomBonusSourceOption>;
    /** Допустимые виды своих бонусов. */
    kinds: ReadonlyArray<CustomBonus['kind']>;
    /** Значение основы с учётом выбранного источника. */
    baseValue: number;
    /** Полная подпись итога — подсказка плитки «Итог». */
    totalLabel: string;
    /** Где итог участвует в подсчётах листа. */
    hint: string;
  }>();

  const rows = defineModel<Array<CustomBonus>>({ required: true });
  const baseSource = defineModel<string>('baseSource', { required: true });

  const baseCustomValue = defineModel<number>('baseCustomValue', {
    required: true,
  });

  const isBaseCustom = computed(
    () => baseSource.value === SETTINGS_BASE_SOURCE.flat,
  );

  const sourceItems = computed(() => [...baseItems]);

  // Подпись плитки — название выбранного источника: плитка и так стоит
  // первой в разборе
  const baseLabel = computed(
    () =>
      baseItems.find((item) => item.value === baseSource.value)?.label ?? '',
  );

  const baseEditLabel = computed(
    () => `${SHEET_SETTINGS_TEXT.baseEditTitle}: ${title}`,
  );

  const customValue = computed(() =>
    getCustomBonusesTotal(rows.value, context),
  );

  const formattedBaseValue = computed(() => formatModifier(baseValue));

  const formattedCustomValue = computed(() =>
    formatModifier(customValue.value),
  );

  const formattedTotalValue = computed(() =>
    formatModifier(baseValue + customValue.value),
  );

  /**
   * Источник основы из выпадающего списка.
   * @param value - выбранный пункт
   */
  function setBaseSource(value: unknown): void {
    const item = baseItems.find((option) => option.value === value);

    if (item) {
      baseSource.value = item.value;
    }
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <h3 class="text-sm font-semibold text-highlighted">
      {{ title }}
    </h3>

    <div class="grid grid-cols-3 gap-2">
      <UPopover :ui="{ content: 'w-64 p-3' }">
        <button
          type="button"
          class="group relative flex w-full cursor-pointer flex-col items-center gap-1 rounded-lg border border-default/50 bg-elevated/20 p-2 transition-colors hover:border-primary/40 sm:p-3"
          :aria-label="baseEditLabel"
        >
          <span
            class="text-center text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ baseLabel }}
          </span>

          <span class="text-2xl leading-none font-bold text-toned tabular-nums">
            {{ formattedBaseValue }}
          </span>

          <!-- Карандаш снизу: сверху он наезжал бы на длинную подпись
            источника вроде «Телосложение» -->
          <UIcon
            name="tabler:pencil"
            class="absolute right-1.5 bottom-1.5 size-3 text-muted opacity-0 transition-opacity group-hover:opacity-100"
          />
        </button>

        <template #content>
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-toned">
                {{ SHEET_SETTINGS_TEXT.baseSourceTitle }}
              </span>

              <USelect
                :model-value="baseSource"
                :items="sourceItems"
                size="sm"
                class="w-36"
                @update:model-value="setBaseSource"
              />
            </div>

            <div
              v-if="isBaseCustom"
              class="flex items-center justify-between gap-3"
            >
              <span class="text-sm text-toned">
                {{ SHEET_SETTINGS_TEXT.baseValueTitle }}
              </span>

              <UInputNumber
                v-model="baseCustomValue"
                :min="CUSTOM_BONUS_RANGE.min"
                :max="CUSTOM_BONUS_RANGE.max"
                :format-options="CUSTOM_BONUS_FORMAT_OPTIONS"
                size="sm"
                class="w-36"
              />
            </div>
          </div>
        </template>
      </UPopover>

      <div
        class="flex flex-col items-center gap-1 rounded-lg border border-default/50 bg-elevated/20 p-2 sm:p-3"
      >
        <span
          class="text-center text-[10px] font-bold tracking-wider text-muted uppercase"
        >
          {{ SHEET_SETTINGS_TEXT.customBonusesTitle }}
        </span>

        <span class="text-2xl leading-none font-bold text-toned tabular-nums">
          {{ formattedCustomValue }}
        </span>
      </div>

      <UTooltip :text="totalLabel">
        <div
          class="flex h-full w-full flex-col items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 p-2 sm:p-3"
        >
          <span
            class="text-center text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ SHEET_SETTINGS_TEXT.totalTitle }}
          </span>

          <span
            class="text-2xl leading-none font-bold text-primary tabular-nums"
            :aria-label="totalLabel"
          >
            {{ formattedTotalValue }}
          </span>
        </div>
      </UTooltip>
    </div>

    <SheetCustomBonusRows
      v-model="rows"
      :classes="classes"
      :context="context"
      :kinds="kinds"
    />

    <p class="text-xs text-dimmed">
      {{ hint }}
    </p>
  </div>
</template>
