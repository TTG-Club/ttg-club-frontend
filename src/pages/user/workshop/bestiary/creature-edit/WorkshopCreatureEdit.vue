<script setup lang="ts">
  import { computed } from 'vue';
  import { useRoute } from 'vue-router';

  import PageLayout from '@/layouts/PageLayout.vue';

  const route = useRoute();

  const creatureId = computed(() => route.params.id);
</script>

<template>
  <page-layout :use-social-links="false">
    <template #title> Редактирование существа </template>

    <template #subtitle>{{ creatureId }}</template>
  </page-layout>
</template>
