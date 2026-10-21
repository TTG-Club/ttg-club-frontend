<script setup lang="ts">
  import PageLayout from '@/layouts/PageLayout.vue';

  import ArmorEditor from './ArmorEditor.vue';
</script>

<template>
  <page-layout>
    <template #title>Создание доспеха</template>

    <armor-editor />
  </page-layout>
</template>
