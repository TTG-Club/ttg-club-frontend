<script setup lang="ts">
  import type { AuthView } from '../model';

  import { PASSWORD_RESET_FORM, SIGN_IN_FORM, SIGN_UP_FORM } from '../model';
  import { PasswordResetRequestForm, SignInForm, SignUpForm } from './ui';

  /** Заголовок окна для скринридера по открытой форме. */
  const VIEW_TITLE: Record<AuthView, string> = {
    'sign-in': SIGN_IN_FORM.title,
    'sign-up': SIGN_UP_FORM.title,
    'password-reset': PASSWORD_RESET_FORM.title,
  };

  /** Вход, регистрация и сброс пароля в одном окне. */
  const { startView = 'sign-in' } = defineProps<{
    /** С какой формы открывается окно. */
    startView?: AuthView;
  }>();

  const isOpened = defineModel<boolean>({ default: false });

  const view = ref<AuthView>(startView);

  const title = computed(() => VIEW_TITLE[view.value]);

  // Окно всегда открывается на своей первой форме
  watch(isOpened, () => {
    view.value = startView;
  });

  function close(): void {
    isOpened.value = false;
  }

  function showSignIn(): void {
    view.value = 'sign-in';
  }

  function showSignUp(): void {
    view.value = 'sign-up';
  }

  function showPasswordReset(): void {
    view.value = 'password-reset';
  }
</script>

<template>
  <UModal
    v-model:open="isOpened"
    :title="title"
    :ui="{ content: 'max-w-sm' }"
  >
    <template #content>
      <div class="relative p-8">
        <SignUpForm
          v-if="view === 'sign-up'"
          @sign-in="showSignIn"
        />

        <PasswordResetRequestForm
          v-else-if="view === 'password-reset'"
          @close="close"
          @sign-in="showSignIn"
        />

        <SignInForm
          v-else
          @close="close"
          @sign-up="showSignUp"
          @password-reset="showPasswordReset"
        />

        <UButton
          :aria-label="SIGN_IN_FORM.closeLabel"
          class="absolute top-3 right-3"
          icon="tabler:x"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="close"
        />
      </div>
    </template>
  </UModal>
</template>
