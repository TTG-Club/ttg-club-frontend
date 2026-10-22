<script setup lang="ts">
  import { getQueryToken, PASSWORD_RESET_FORM } from '~user/model';
  import { PasswordResetConfirm } from '~user/password-reset';

  // Ссылка из письма личная, поисковикам она не нужна
  useSeoMeta({
    title: PASSWORD_RESET_FORM.title,
    robots: 'noindex, nofollow',
  });

  const route = useRoute();

  const token = computed(() => getQueryToken(route.query.token));
</script>

<template>
  <ClientOnly>
    <PasswordResetConfirm :token="token" />
  </ClientOnly>
</template>
