<script setup lang="ts">
  import { DM_SCREEN_PATH, DM_SCREEN_TITLE } from '~dm-screen/model';
  import { DmScreenAccount } from '~dm-screen/screen';

  definePageMeta({ layout: 'section' });

  useSeoMeta({ title: DM_SCREEN_TITLE });

  const route = useRoute();
  const { isLoggedIn, pending } = useUser();

  const id = computed(() => {
    const value = route.params.id;

    return typeof value === 'string' && value ? value : '';
  });

  // Ширмы из аккаунта видны только хозяину: гостя — к его ширме в браузере
  watchEffect(() => {
    if (import.meta.client && !pending.value && !isLoggedIn.value) {
      void navigateTo(DM_SCREEN_PATH, { replace: true });
    }
  });
</script>

<template>
  <ClientOnly>
    <DmScreenAccount
      v-if="!pending && isLoggedIn && id"
      :id="id"
      :key="id"
    />
  </ClientOnly>
</template>
