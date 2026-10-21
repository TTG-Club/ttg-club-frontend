<script setup lang="ts">
  import { AuthModal } from '~user/auth-modal';

  import { GUEST_HELMET_ICON, SIGN_IN_BUTTON_LABEL } from '../model';
  import { UserMenu } from './ui';

  const { isLoggedIn, pending } = useUser();

  const isAuthOpened = ref(false);

  function openAuth() {
    isAuthOpened.value = true;
  }
</script>

<template>
  <UserMenu v-if="isLoggedIn" />

  <template v-else>
    <UButton
      :icon="GUEST_HELMET_ICON"
      :aria-label="SIGN_IN_BUTTON_LABEL"
      :loading="pending"
      color="neutral"
      variant="ghost"
      size="xl"
      @click.left.exact.prevent="openAuth"
    />

    <AuthModal v-model="isAuthOpened" />
  </template>
</template>
