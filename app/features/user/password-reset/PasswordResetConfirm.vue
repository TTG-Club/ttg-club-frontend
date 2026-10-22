<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui';

  import type { AuthView, NewPasswordState } from '../model';

  import { AuthModal } from '~user/auth-modal';
  import { AuthPasswordInput } from '~user/password-input';

  import {
    AUTH_ICON,
    AUTH_ROUTE,
    confirmPasswordReset,
    getApiErrorMessage,
    newPasswordSchema,
    PASSWORD_RESET_FORM,
    validatePasswordResetToken,
  } from '../model';

  /**
   * Новый пароль по ссылке из письма: сначала проверяется сама ссылка, потом
   * пароль сохраняется и можно войти.
   */
  const { token = undefined } = defineProps<{
    token?: string;
  }>();

  const toast = useToast();

  const isSubmitting = ref(false);
  const isSaved = ref(false);
  const isAuthOpen = ref(false);

  // После смены пароля окно открывается на входе, иначе — на новой ссылке
  const authView = computed<AuthView>(() =>
    isSaved.value ? 'sign-in' : 'password-reset',
  );

  const state = reactive<NewPasswordState>({ password: '', repeat: '' });

  const { status, error } = useAsyncData(
    () => `password-reset-token:${token}`,
    async () => {
      if (!token) {
        throw new Error(PASSWORD_RESET_FORM.noToken);
      }

      await validatePasswordResetToken(token);

      return true;
    },
    { server: false },
  );

  const isChecking = computed(
    () => status.value === 'pending' || status.value === 'idle',
  );

  const errorText = computed(() => {
    if (!token) {
      return PASSWORD_RESET_FORM.noToken;
    }

    return getApiErrorMessage(error.value, PASSWORD_RESET_FORM.invalidToken);
  });

  /**
   * Сохраняет новый пароль.
   * @param event - проверенная форма
   */
  async function submit(
    event: FormSubmitEvent<NewPasswordState>,
  ): Promise<void> {
    if (!token) {
      return;
    }

    isSubmitting.value = true;

    try {
      await confirmPasswordReset(token, event.data.password);
      isSaved.value = true;
    } catch (submitError) {
      toast.add({
        title: getApiErrorMessage(submitError, PASSWORD_RESET_FORM.failed),
        color: 'error',
        icon: AUTH_ICON.error,
      });
    } finally {
      isSubmitting.value = false;
    }
  }

  function openAuth(): void {
    isAuthOpen.value = true;
  }
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-sm flex-col gap-6 rounded-xl border border-default bg-elevated/50 p-8"
  >
    <div
      v-if="isChecking"
      class="flex items-center justify-center gap-2 py-6 text-muted"
    >
      <UIcon
        :name="AUTH_ICON.pending"
        class="size-5 animate-spin"
      />

      {{ PASSWORD_RESET_FORM.checking }}
    </div>

    <UEmpty
      v-else-if="isSaved"
      :icon="AUTH_ICON.success"
      :title="PASSWORD_RESET_FORM.saved"
      variant="naked"
    >
      <template #actions>
        <UButton
          :label="PASSWORD_RESET_FORM.signIn"
          :icon="AUTH_ICON.user"
          @click.left.exact.prevent="openAuth"
        />
      </template>
    </UEmpty>

    <UEmpty
      v-else-if="error || !token"
      :icon="AUTH_ICON.failed"
      :title="PASSWORD_RESET_FORM.title"
      :description="errorText"
      variant="naked"
    >
      <template #actions>
        <UButton
          :label="PASSWORD_RESET_FORM.home"
          :to="AUTH_ROUTE.home"
          color="neutral"
          variant="subtle"
        />

        <UButton
          :label="PASSWORD_RESET_FORM.requestAgain"
          @click.left.exact.prevent="openAuth"
        />
      </template>
    </UEmpty>

    <template v-else>
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold text-title">
          {{ PASSWORD_RESET_FORM.newTitle }}
        </h1>

        <p class="text-sm text-muted">
          {{ PASSWORD_RESET_FORM.newDescription }}
        </p>
      </div>

      <UForm
        :schema="newPasswordSchema"
        :state="state"
        class="flex flex-col gap-4"
        @submit="submit"
      >
        <UFormField name="password">
          <AuthPasswordInput
            v-model="state.password"
            :placeholder="PASSWORD_RESET_FORM.passwordPlaceholder"
            autocomplete="new-password"
          />
        </UFormField>

        <UFormField name="repeat">
          <AuthPasswordInput
            v-model="state.repeat"
            :placeholder="PASSWORD_RESET_FORM.repeatPlaceholder"
            :icon="AUTH_ICON.repeat"
            autocomplete="new-password"
          />
        </UFormField>

        <UButton
          :label="PASSWORD_RESET_FORM.saveLabel"
          :loading="isSubmitting"
          type="submit"
          size="lg"
          block
        />
      </UForm>
    </template>

    <AuthModal
      v-model="isAuthOpen"
      :start-view="authView"
    />
  </div>
</template>
