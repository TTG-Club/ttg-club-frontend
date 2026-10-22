<script setup lang="ts">
  import { InitiativeWorkspace } from '~tools/initiative/workspace';

  definePageMeta({ layout: 'section' });

  // Страница конкретного боя приватна, поисковикам она не нужна
  useSeoMeta({ robots: 'noindex, nofollow' });

  const route = useRoute();

  const id = computed(() => {
    const { id: param } = route.params;

    return typeof param === 'string' ? param : '';
  });
</script>

<template>
  <ClientOnly>
    <InitiativeWorkspace :id="id" />
  </ClientOnly>
</template>
