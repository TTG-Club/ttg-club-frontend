<script setup lang="ts">
  import { DmScreenManager } from '~dm-screen/manager';
  import { DM_SCREEN_TITLE } from '~dm-screen/model';
  import { DmScreenGuest } from '~dm-screen/screen';

  definePageMeta({ layout: 'section' });

  useSeoMeta({ title: DM_SCREEN_TITLE });

  // Пользователю — список его ширм, гостю — его единственная ширма в
  // браузере. И то и другое читается из браузера, поэтому только там
  const { isLoggedIn, pending } = useUser();
</script>

<template>
  <ClientOnly>
    <template v-if="!pending">
      <DmScreenManager v-if="isLoggedIn" />

      <DmScreenGuest v-else />
    </template>
  </ClientOnly>
</template>
