<script setup lang="ts">
  import { ru } from '@nuxt/ui/locale';

  import { GRAPHICS_MODE_ATTRIBUTE } from '~/shared/consts';
  import { useMaintenanceGate } from '~infrastructure/maintenance/composables';
  import { MaintenanceScreen } from '~infrastructure/maintenance/ui';

  useThemeHead();

  const { mode: graphicsMode } = useGraphicsMode();

  useHead({
    htmlAttrs: {
      lang: 'ru',
      // По режиму графики стили отключают размытие фона
      [GRAPHICS_MODE_ATTRIBUTE]: graphicsMode,
    },
  });

  usePageMeta();

  // Режим «сайт закрыт на обновление»: вместо страницы — заглушка. Сама
  // страница при этом не рендерится вовсе, и её данные не загружаются.
  const { isBlocked: isMaintenanceBlocked } = useMaintenanceGate();
</script>

<template>
  <UApp :locale="ru">
    <NuxtLoadingIndicator color="var(--primary)" />

    <MaintenanceScreen v-if="isMaintenanceBlocked" />

    <template v-else>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </template>
  </UApp>
</template>
