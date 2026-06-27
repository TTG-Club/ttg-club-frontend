<script setup lang="ts">
  import PageLayout from '@/layouts/PageLayout.vue';

  import ClassEditor from './ClassEditor.vue';
</script>

<template>
  <page-layout>
    <template #title>Создание класса</template>

    <class-editor />
  </page-layout>
</template>
