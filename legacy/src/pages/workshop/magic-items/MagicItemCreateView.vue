<script setup lang="ts">
  import PageLayout from '@/layouts/PageLayout.vue';

  import MagicItemEditor from './MagicItemEditor.vue';
</script>

<template>
  <page-layout>
    <template #title>Создание магического предмета</template>

    <magic-item-editor />
  </page-layout>
</template>
