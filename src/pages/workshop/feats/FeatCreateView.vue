<script setup lang="ts">
  import PageLayout from '@/layouts/PageLayout.vue';

  import FeatEditor from './FeatEditor.vue';
</script>

<template>
  <page-layout>
    <template #title>Создание черты</template>

    <feat-editor />
  </page-layout>
</template>
