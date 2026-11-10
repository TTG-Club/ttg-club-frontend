<script setup lang="ts">
  import { ru } from '@nuxt/ui/locale';

  import { useMaintenanceGate } from '~infrastructure/maintenance/composables';
  import { MaintenanceScreen } from '~infrastructure/maintenance/ui';

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

    <NuxtLayout v-else>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
