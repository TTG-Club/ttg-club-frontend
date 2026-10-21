<script setup lang="ts">
  import PageLayout from '@/layouts/PageLayout.vue';

  import RaceEditor from './RaceEditor.vue';
</script>

<template>
  <page-layout>
    <template #title>Создание расы</template>

    <race-editor />
  </page-layout>
</template>
