<script setup lang="ts">
  import { DmScreenCanvas } from '~dm-screen/canvas';
  import { DM_SCREEN_TITLE } from '~dm-screen/model';

  definePageMeta({ layout: 'section' });

  useSeoMeta({ title: DM_SCREEN_TITLE });

  // Окна и список читаются из браузера: на сервере ширма пуста, поэтому
  // холст рисуется только в браузере
</script>

<template>
  <ClientOnly>
    <DmScreenCanvas />
  </ClientOnly>
</template>
