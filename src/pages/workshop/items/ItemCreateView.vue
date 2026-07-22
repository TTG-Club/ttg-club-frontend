<script setup lang="ts">
  import PageLayout from '@/layouts/PageLayout.vue';

  import ItemEditor from './ItemEditor.vue';
</script>

<template>
  <page-layout>
    <template #title>Создание снаряжения</template>

    <item-editor />
  </page-layout>
</template>
