<script setup lang="ts">
  import AuthModal from '@/shared/ui/modals/AuthModal.vue';

  import ChangePasswordView from '@/features/account/ChangePasswordView.vue';
  import LoginView from '@/features/account/LoginView.vue';
  import RegistrationView from '@/features/account/RegistrationView.vue';

  import {
    COMMENTS_AUTH_CHANGE_PASSWORD_TITLE,
    COMMENTS_AUTH_LOGIN_TITLE,
    COMMENTS_AUTH_REGISTRATION_TITLE,
  } from '../model';

  const isOpen = defineModel<boolean>({ default: false });

  /** Экран окна авторизации; переключается ссылками внутри форм. */
  type AuthScreen = 'login' | 'registration' | 'change-password';

  const screen = ref<AuthScreen>('login');

  const title = computed(() => {
    switch (screen.value) {
      case 'registration':
        return COMMENTS_AUTH_REGISTRATION_TITLE;
      case 'change-password':
        return COMMENTS_AUTH_CHANGE_PASSWORD_TITLE;
      default:
        return COMMENTS_AUTH_LOGIN_TITLE;
    }
  });

  function close(): void {
    isOpen.value = false;
  }

  function showRegistration(): void {
    screen.value = 'registration';
  }

  function showLogin(): void {
    screen.value = 'login';
  }

  function showChangePassword(): void {
    screen.value = 'change-password';
  }

  // Окно всегда открывается с формы входа: экран, выбранный в прошлый раз,
  // к следующему вызову уже не относится.
  // Цикла нет: вотчер меняет только локальный экран, на открытость не влияет.
  watch(isOpen, (opened) => {
    if (opened) {
      showLogin();
    }
  });
</script>

<template>
  <auth-modal
    v-model="isOpen"
    :title="title"
    @close="close"
  >
    <registration-view
      v-if="screen === 'registration'"
      @close="close"
      @switch:auth="showLogin"
    />

    <change-password-view
      v-else-if="screen === 'change-password'"
      @close="close"
      @switch:auth="showLogin"
    />

    <login-view
      v-else
      @close="close"
      @switch:reg="showRegistration"
      @switch:change-password="showChangePassword"
    />
  </auth-modal>
</template>
