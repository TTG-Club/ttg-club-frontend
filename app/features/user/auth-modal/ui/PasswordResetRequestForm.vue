<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui';

  import type { PasswordResetRequestState } from '../../model';

  import {
    AUTH_ICON,
    getApiErrorMessage,
    PASSWORD_RESET_FORM,
    passwordResetRequestSchema,
    requestPasswordReset,
    SIGN_IN_TOASTS,
  } from '../../model';

  /** Забытый пароль: письмо со ссылкой на новый. */
  const emit = defineEmits<{
    'close': [];
    'sign-in': [];
  }>();

  const toast = useToast();

  const isSubmitting = ref(false);

  const state = reactive<PasswordResetRequestState>({ email: '' });

  /**
   * Просит письмо со ссылкой.
   * @param event - проверенная форма
   */
  async function submit(
    event: FormSubmitEvent<PasswordResetRequestState>,
  ): Promise<void> {
    isSubmitting.value = true;

    try {
      await requestPasswordReset(event.data.email);

      toast.add({
        title: PASSWORD_RESET_FORM.sent,
        color: 'success',
        icon: AUTH_ICON.sent,
      });

      emit('close');
    } catch (error) {
      toast.add({
        title: getApiErrorMessage(error, SIGN_IN_TOASTS.unknownError),
        color: 'error',
        icon: AUTH_ICON.error,
      });
    } finally {
      isSubmitting.value = false;
    }
  }

  function openSignIn(): void {
    emit('sign-in');
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-1">
      <h2 class="text-2xl font-semibold text-title">
        {{ PASSWORD_RESET_FORM.title }}
      </h2>

      <p class="text-sm text-muted">{{ PASSWORD_RESET_FORM.description }}</p>
    </div>

    <UForm
      :schema="passwordResetRequestSchema"
      :state="state"
      class="flex flex-col gap-4"
      @submit="submit"
    >
      <UFormField name="email">
        <UInput
          v-model="state.email"
          :placeholder="PASSWORD_RESET_FORM.emailPlaceholder"
          :icon="AUTH_ICON.email"
          type="email"
          class="w-full"
          size="lg"
          autocapitalize="off"
          autocomplete="email"
          autocorrect="off"
          autofocus
        />
      </UFormField>

      <UButton
        :label="PASSWORD_RESET_FORM.submitLabel"
        :loading="isSubmitting"
        type="submit"
        size="lg"
        block
      />
    </UForm>

    <div
      class="flex flex-wrap items-center justify-center gap-x-2 border-t border-default pt-5 text-sm text-muted"
    >
      {{ PASSWORD_RESET_FORM.remembered }}

      <UButton
        :label="PASSWORD_RESET_FORM.signIn"
        variant="link"
        class="p-0"
        @click.left.exact.prevent="openSignIn"
      />
    </div>
  </div>
</template>
