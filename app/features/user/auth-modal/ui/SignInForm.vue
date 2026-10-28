<script setup lang="ts">
  import { AuthPasswordInput } from '~user/password-input';

  import {
    AUTH_ICON,
    getErrorStatus,
    SIGN_IN_FORM,
    SIGN_IN_TOASTS,
    WRONG_CREDENTIALS_STATUS,
  } from '../../model';

  const emit = defineEmits<{
    'close': [];
    'sign-up': [];
    'password-reset': [];
  }>();

  const { signIn } = useUser();
  const toast = useToast();

  const isSubmitting = ref(false);

  const state = reactive({
    usernameOrEmail: '',
    password: '',
    remember: true,
  });

  function openSignUp(): void {
    emit('sign-up');
  }

  function openPasswordReset(): void {
    emit('password-reset');
  }

  function showError(description: string) {
    toast.add({
      title: description,
      color: 'error',
      icon: AUTH_ICON.error,
    });
  }

  async function submit() {
    if (!state.usernameOrEmail || !state.password) {
      showError(SIGN_IN_TOASTS.emptyFields);

      return;
    }

    isSubmitting.value = true;

    try {
      if (!(await signIn({ ...state }))) {
        showError(SIGN_IN_TOASTS.profileFailed);

        return;
      }

      toast.add({
        title: SIGN_IN_TOASTS.success,
        color: 'success',
        icon: AUTH_ICON.success,
      });

      emit('close');
    } catch (error) {
      showError(
        getErrorStatus(error) === WRONG_CREDENTIALS_STATUS
          ? SIGN_IN_TOASTS.wrongCredentials
          : SIGN_IN_TOASTS.unknownError,
      );
    } finally {
      isSubmitting.value = false;
    }
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-1">
      <h2 class="text-2xl font-semibold text-title">
        {{ SIGN_IN_FORM.title }}
      </h2>

      <p class="text-sm text-muted">{{ SIGN_IN_FORM.description }}</p>
    </div>

    <UForm
      :state
      class="flex flex-col gap-4"
      @submit="submit"
    >
      <UFormField name="usernameOrEmail">
        <UInput
          v-model="state.usernameOrEmail"
          :placeholder="SIGN_IN_FORM.loginPlaceholder"
          class="w-full"
          size="lg"
          :icon="AUTH_ICON.user"
          autocapitalize="off"
          autocomplete="username"
          autocorrect="off"
          autofocus
        />
      </UFormField>

      <UFormField name="password">
        <AuthPasswordInput
          v-model="state.password"
          :placeholder="SIGN_IN_FORM.passwordPlaceholder"
        />
      </UFormField>

      <div class="flex items-center justify-between gap-2">
        <UCheckbox
          v-model="state.remember"
          :label="SIGN_IN_FORM.rememberLabel"
        />

        <UButton
          :label="SIGN_IN_FORM.forgotPassword"
          variant="link"
          class="p-0"
          @click.left.exact.prevent="openPasswordReset"
        />
      </div>

      <UButton
        :label="SIGN_IN_FORM.submitLabel"
        :loading="isSubmitting"
        type="submit"
        size="lg"
        block
      />
    </UForm>

    <div
      class="flex flex-wrap items-center justify-center gap-x-2 border-t border-default pt-5 text-sm text-muted"
    >
      {{ SIGN_IN_FORM.noAccount }}

      <UButton
        :label="SIGN_IN_FORM.signUp"
        variant="link"
        class="p-0"
        @click.left.exact.prevent="openSignUp"
      />
    </div>
  </div>
</template>
