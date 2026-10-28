<script setup lang="ts">
  import { getQueryToken, VERIFY_EMAIL_PAGE } from '~user/model';
  import { EmailVerification } from '~user/verify-email';

  // Ссылка из письма личная, поисковикам она не нужна
  useSeoMeta({
    title: VERIFY_EMAIL_PAGE.title,
    robots: 'noindex, nofollow',
  });

  const route = useRoute();

  const token = computed(() => getQueryToken(route.query.token));
</script>

<template>
  <ClientOnly>
    <EmailVerification :token="token" />
  </ClientOnly>
</template>
