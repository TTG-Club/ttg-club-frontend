<script setup lang="ts">
  import { ru } from '@nuxt/ui/locale';

  const { htmlClass } = useTheme();

  useHead({
    htmlAttrs: {
      lang: 'ru',
      class: htmlClass,
    },
  });

  usePageMeta();
</script>

<template>
  <UApp :locale="ru">
    <NuxtLoadingIndicator color="var(--primary)" />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
