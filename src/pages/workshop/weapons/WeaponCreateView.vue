<script setup lang="ts">
  import PageLayout from '@/layouts/PageLayout.vue';

  import WeaponEditor from './WeaponEditor.vue';
</script>

<template>
  <page-layout>
    <template #title>Создание оружия</template>

    <weapon-editor />
  </page-layout>
</template>
