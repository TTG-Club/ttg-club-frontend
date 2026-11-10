<script setup lang="ts">
  import type { CustomThemeBase } from '~infrastructure/custom-theme/model';

  import { useCustomThemeLightness } from '~infrastructure/custom-theme/composables';
  import {
    changeCustomThemeAccentLightness,
    changeCustomThemeBackgroundLightness,
    CUSTOM_THEME_ACCENT_PRESETS,
    CUSTOM_THEME_BACKGROUND_PRESETS,
    CUSTOM_THEME_DEFAULT_LIGHTNESS,
    getCustomThemeAccentLightness,
    getCustomThemeBackgroundLightness,
    getCustomThemeBase,
  } from '~infrastructure/custom-theme/model';

  import { DisplaySettingsChoice } from '../choice';
  import {
    CUSTOM_THEME_ACCENT_PICKER_LABEL,
    CUSTOM_THEME_ACCENT_TITLE,
    CUSTOM_THEME_BACKGROUND_COLOR_TITLE,
    CUSTOM_THEME_BACKGROUND_PICKER_LABEL,
    CUSTOM_THEME_BACKGROUND_TITLE,
    CUSTOM_THEME_BASE_OPTIONS,
    CUSTOM_THEME_BASE_TITLE,
    CUSTOM_THEME_RESET_LABEL,
    CUSTOM_THEME_TITLE,
  } from './constants';
  import DisplaySettingsColorSwatches from './DisplaySettingsColorSwatches.vue';
  import DisplaySettingsLightnessSlider from './DisplaySettingsLightnessSlider.vue';

  /**
   * Своя тема: фон (основа, цвет, яркость) и акцент (цвет, яркость). Всё
   * остальное — уровни текста, поверхности, рамки, цвета состояний —
   * считается само, поэтому сайт меняется целиком от нескольких ручек.
   */
  const { customSettings, changeCustomSettings, resetCustomSettings } =
    useTheme();

  const background = computed({
    get: () => customSettings.value.background,
    set: (value: string) => changeCustomSettings({ background: value }),
  });

  const accent = computed({
    get: () => customSettings.value.accent,
    set: (value: string) => changeCustomSettings({ accent: value }),
  });

  // Смена основы ставит яркость, привычную для неё, и сохраняет оттенок фона:
  // иначе тёмный графит превратился бы в серую светлую тему
  const base = computed({
    get: () => getCustomThemeBase(background.value),
    set: (value: CustomThemeBase) => {
      background.value = changeCustomThemeBackgroundLightness(
        background.value,
        value,
        CUSTOM_THEME_DEFAULT_LIGHTNESS[value],
      );
    },
  });

  const backgroundLightness = useCustomThemeLightness(background, {
    read: getCustomThemeBackgroundLightness,
    change: (source, lightness) =>
      changeCustomThemeBackgroundLightness(source, base.value, lightness),
  });

  // Пределы яркости акцента зависят от фона: с другим фоном прошлый шаг
  // ползунка уже не годится
  const accentLightness = useCustomThemeLightness(accent, {
    read: (color) => getCustomThemeAccentLightness(background.value, color),
    change: (source, lightness) =>
      changeCustomThemeAccentLightness(background.value, source, lightness),
    context: () => background.value,
  });
</script>

<template>
  <section class="flex flex-col gap-4 rounded-lg bg-elevated/50 p-3">
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

    <fieldset class="flex flex-col gap-3">
      <legend class="mb-2 text-xs font-semibold text-muted uppercase">
        {{ CUSTOM_THEME_BACKGROUND_TITLE }}
      </legend>

      <DisplaySettingsChoice
        v-model="base"
        :title="CUSTOM_THEME_BASE_TITLE"
        :options="CUSTOM_THEME_BASE_OPTIONS"
        shape="pill"
      />

      <div class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-default">
          {{ CUSTOM_THEME_BACKGROUND_COLOR_TITLE }}
        </span>

        <DisplaySettingsColorSwatches
          v-model="background"
          :presets="CUSTOM_THEME_BACKGROUND_PRESETS"
          :picker-label="CUSTOM_THEME_BACKGROUND_PICKER_LABEL"
        />
      </div>

      <DisplaySettingsLightnessSlider v-model="backgroundLightness" />
    </fieldset>

    <USeparator />

    <fieldset class="flex flex-col gap-3">
      <legend class="mb-2 text-xs font-semibold text-muted uppercase">
        {{ CUSTOM_THEME_ACCENT_TITLE }}
      </legend>

      <DisplaySettingsColorSwatches
        v-model="accent"
        :presets="CUSTOM_THEME_ACCENT_PRESETS"
        :picker-label="CUSTOM_THEME_ACCENT_PICKER_LABEL"
      />

      <DisplaySettingsLightnessSlider v-model="accentLightness" />
    </fieldset>
  </section>
</template>
