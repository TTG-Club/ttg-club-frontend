<script setup lang="ts">
  import type { CustomThemeBase } from '~infrastructure/custom-theme/model';

  import {
    CUSTOM_THEME_ACCENT_PRESETS,
    CUSTOM_THEME_DEFAULT_LIGHTNESS,
  } from '~infrastructure/custom-theme/model';

  import { DisplaySettingsChoice } from '../choice';
  import {
    CUSTOM_THEME_ACCENT_PICKER_LABEL,
    CUSTOM_THEME_ACCENT_TITLE,
    CUSTOM_THEME_BASE_OPTIONS,
    CUSTOM_THEME_BASE_TITLE,
    CUSTOM_THEME_HUE_GRADIENT_COLOR,
    CUSTOM_THEME_HUE_GRADIENT_STEP,
    CUSTOM_THEME_HUE_RANGE,
    CUSTOM_THEME_HUE_TITLE,
    CUSTOM_THEME_LIGHTNESS_TITLE,
    CUSTOM_THEME_PERCENT_RANGE,
    CUSTOM_THEME_PICKER_BUTTON,
    CUSTOM_THEME_RESET_LABEL,
    CUSTOM_THEME_SWATCH_CLASS,
    CUSTOM_THEME_TINT_NEUTRAL_LABEL,
    CUSTOM_THEME_TINT_TITLE,
    CUSTOM_THEME_TITLE,
  } from './constants';

  type SliderValue = number | Array<number> | undefined;

  /**
   * Число из значения ползунка. USlider отдаёт значение массивом даже с одним
   * бегунком, а настройки темы ждут число — иначе проверка сочтёт их
   * испорченными и сбросит тему.
   *
   * @param value Значение ползунка.
   * @returns Число или 0, если значения нет.
   */
  function readSliderValue(value: SliderValue): number {
    return (Array.isArray(value) ? value[0] : value) ?? 0;
  }

  /**
   * Полоска всех оттенков под ползунком оттенка фона.
   *
   * @returns Значение CSS `background`.
   */
  function buildHueGradient(): string {
    const { lightness, chroma } = CUSTOM_THEME_HUE_GRADIENT_COLOR;
    const stops: Array<string> = [];

    for (
      let hue = CUSTOM_THEME_HUE_RANGE.min;
      hue <= CUSTOM_THEME_HUE_RANGE.max;
      hue += CUSTOM_THEME_HUE_GRADIENT_STEP
    ) {
      stops.push(`oklch(${lightness} ${chroma} ${hue})`);
    }

    return `linear-gradient(90deg, ${stops.join(', ')})`;
  }

  /**
   * Своя тема: тёмная или светлая основа, яркость, оттенок и насыщенность
   * фона и акцент. Всё остальное — уровни текста, поверхности, рамки, цвета
   * состояний — считается само, поэтому сайт меняется целиком от нескольких
   * ручек.
   */
  const { customSettings, changeCustomSettings, resetCustomSettings } =
    useTheme();

  const hueGradient = buildHueGradient();

  // Смена основы ставит яркость фона, привычную для неё: иначе тёмный графит
  // превратился бы в серую светлую тему
  const base = computed({
    get: () => customSettings.value.base,
    set: (value: CustomThemeBase) =>
      changeCustomSettings({
        base: value,
        backgroundLightness: CUSTOM_THEME_DEFAULT_LIGHTNESS[value],
      }),
  });

  const backgroundLightness = computed({
    get: () => customSettings.value.backgroundLightness,
    set: (value: SliderValue) =>
      changeCustomSettings({ backgroundLightness: readSliderValue(value) }),
  });

  const accent = computed({
    get: () => customSettings.value.accent,
    set: (value: string | undefined) => {
      if (value) {
        changeCustomSettings({ accent: value.toLowerCase() });
      }
    },
  });

  const backgroundHue = computed({
    get: () => customSettings.value.backgroundHue,
    set: (value: SliderValue) =>
      changeCustomSettings({ backgroundHue: readSliderValue(value) }),
  });

  const backgroundTint = computed({
    get: () => customSettings.value.backgroundTint,
    set: (value: SliderValue) =>
      changeCustomSettings({ backgroundTint: readSliderValue(value) }),
  });

  const tintLabel = computed(() =>
    backgroundTint.value === 0
      ? CUSTOM_THEME_TINT_NEUTRAL_LABEL
      : `${backgroundTint.value}%`,
  );

  const presets = computed(() =>
    CUSTOM_THEME_ACCENT_PRESETS.map((preset) => {
      const isSelected = preset.value === accent.value;

      return {
        ...preset,
        isSelected,
        outlineClass: isSelected
          ? CUSTOM_THEME_SWATCH_CLASS.selected
          : CUSTOM_THEME_SWATCH_CLASS.idle,
      };
    }),
  );

  const isCustomAccent = computed(() =>
    presets.value.every((preset) => !preset.isSelected),
  );

  // Свой цвет вне готовых — кнопка выбора подсвечена как выбранная
  const pickerButtonProps = computed(() =>
    isCustomAccent.value
      ? CUSTOM_THEME_PICKER_BUTTON.selected
      : CUSTOM_THEME_PICKER_BUTTON.idle,
  );

  /**
   * Ставит акцент из готовых цветов.
   *
   * @param value Цвет в формате `#rrggbb`.
   */
  function selectAccent(value: string) {
    accent.value = value;
  }
</script>

<template>
  <section class="flex flex-col gap-3 rounded-lg bg-elevated/50 p-3">
    <div class="flex items-center justify-between gap-2">
      <h4 class="text-sm font-semibold text-highlighted">
        {{ CUSTOM_THEME_TITLE }}
      </h4>

      <UButton
        :label="CUSTOM_THEME_RESET_LABEL"
        icon="tabler:restore"
        variant="ghost"
        color="neutral"
        size="xs"
        @click.left.exact.prevent="resetCustomSettings"
      />
    </div>

    <DisplaySettingsChoice
      v-model="base"
      :title="CUSTOM_THEME_BASE_TITLE"
      :options="CUSTOM_THEME_BASE_OPTIONS"
      shape="pill"
    />

    <div class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-default">
        {{ CUSTOM_THEME_LIGHTNESS_TITLE }}
      </span>

      <USlider
        v-model="backgroundLightness"
        :min="CUSTOM_THEME_PERCENT_RANGE.min"
        :max="CUSTOM_THEME_PERCENT_RANGE.max"
        size="sm"
        color="neutral"
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-default">
        {{ CUSTOM_THEME_ACCENT_TITLE }}
      </span>

      <div class="flex flex-wrap items-center gap-1.5">
        <UButton
          v-for="preset in presets"
          :key="preset.value"
          variant="ghost"
          color="neutral"
          class="size-7 rounded-full p-0 outline-offset-2"
          :class="preset.outlineClass"
          :style="{ backgroundColor: preset.value }"
          :title="preset.label"
          :aria-label="preset.label"
          :aria-pressed="preset.isSelected"
          @click.left.exact.prevent="selectAccent(preset.value)"
        />

        <UPopover :content="{ side: 'bottom', align: 'start' }">
          <UButton
            icon="tabler:color-picker"
            v-bind="pickerButtonProps"
            size="sm"
            square
            :aria-label="CUSTOM_THEME_ACCENT_PICKER_LABEL"
            :title="CUSTOM_THEME_ACCENT_PICKER_LABEL"
          />

          <template #content>
            <div class="p-3">
              <UColorPicker
                v-model="accent"
                size="sm"
              />
            </div>
          </template>
        </UPopover>
      </div>
    </div>

    <div class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-default">
        {{ CUSTOM_THEME_HUE_TITLE }}
      </span>

      <USlider
        v-model="backgroundHue"
        :min="CUSTOM_THEME_HUE_RANGE.min"
        :max="CUSTOM_THEME_HUE_RANGE.max"
        size="sm"
        color="neutral"
      />

      <div
        class="h-1.5 rounded-full"
        :style="{ background: hueGradient }"
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <div class="flex items-baseline justify-between gap-2 text-sm">
        <span class="font-medium text-default">
          {{ CUSTOM_THEME_TINT_TITLE }}
        </span>

        <span class="text-xs text-muted">{{ tintLabel }}</span>
      </div>

      <USlider
        v-model="backgroundTint"
        :min="CUSTOM_THEME_PERCENT_RANGE.min"
        :max="CUSTOM_THEME_PERCENT_RANGE.max"
        size="sm"
        color="neutral"
      />
    </div>
  </section>
</template>
