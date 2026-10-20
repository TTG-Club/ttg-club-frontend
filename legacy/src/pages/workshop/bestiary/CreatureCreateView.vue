<script setup lang="ts">
  import PageLayout from '@/layouts/PageLayout.vue';

  import CreatureEditor from './CreatureEditor.vue';
</script>

<template>
  <page-layout>
    <template #title>Создание существа</template>

    <creature-editor />
  </page-layout>
</template>
