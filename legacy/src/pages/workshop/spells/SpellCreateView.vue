<script setup lang="ts">
  import PageLayout from '@/layouts/PageLayout.vue';

  import SpellEditor from './SpellEditor.vue';
</script>

<template>
  <page-layout>
    <template #title>Создание заклинания</template>

    <spell-editor />
  </page-layout>
</template>
