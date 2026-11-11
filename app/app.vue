<script setup lang="ts">
  import { ru } from '@nuxt/ui/locale';

  import { useMaintenanceGate } from '~infrastructure/maintenance/composables';
  import { MaintenanceScreen } from '~infrastructure/maintenance/ui';
  import { ScreenWindows } from '~wiki/screens';

  useThemeHead();

  useHead({
    htmlAttrs: {
      lang: 'ru',
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

      <!-- Окна ширмы живут поверх всех страниц и переживают переходы -->
      <ClientOnly>
        <ScreenWindows />
      </ClientOnly>
    </template>
  </UApp>
</template>
