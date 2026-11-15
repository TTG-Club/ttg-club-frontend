<script setup lang="ts">
  import { DM_SCREEN_TITLE, DM_SCREEN_USAGE_FEATURE } from '~dm-screen/model';
  import { DmScreenGuest, DmScreenOwn } from '~dm-screen/screen';
  import { useFeatureUsage } from '~infrastructure/analytics/composables';

  definePageMeta({ layout: 'section' });

  useSeoMeta({ title: DM_SCREEN_TITLE });

  useFeatureUsage(DM_SCREEN_USAGE_FEATURE);

  // Ширма у каждого одна: у пользователя — в аккаунте, у гостя — в
  // браузере. Списка ширм (`~dm-screen/manager`) на странице пока нет: он
  // вернётся, когда ширм снова можно будет вести несколько
  const { isLoggedIn, pending } = useUser();
</script>

<template>
  <ClientOnly>
    <template v-if="!pending">
      <DmScreenOwn v-if="isLoggedIn" />

      <DmScreenGuest v-else />
    </template>
  </ClientOnly>
</template>
