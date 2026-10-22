<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui';

  import type { PasswordChangeState } from '../model';

  import { AuthPasswordInput } from '~user/password-input';

  import {
    AUTH_ICON,
    changePassword,
    getApiErrorMessage,
    passwordChangeSchema,
    PROFILE_ICON,
    PROFILE_TEXT,
  } from '../model';

  /** Смена пароля вошедшего пользователя. */
  const toast = useToast();

  const isSubmitting = ref(false);

  const state = reactive<PasswordChangeState>({
    currentPassword: '',
    password: '',
    repeat: '',
  });

  /** Очищает поля после успешной смены. */
  function reset(): void {
    state.currentPassword = '';
    state.password = '';
    state.repeat = '';
  }

  /**
   * Меняет пароль.
   * @param event - проверенная форма
   */
  async function submit(
    event: FormSubmitEvent<PasswordChangeState>,
  ): Promise<void> {
    isSubmitting.value = true;

    try {
      await changePassword(event.data.currentPassword, event.data.password);
      reset();

      toast.add({
        title: PROFILE_TEXT.passwordSaved,
        color: 'success',
        icon: PROFILE_ICON.saved,
      });
    } catch (error) {
      toast.add({
        title: PROFILE_TEXT.passwordFailed,
        description: getApiErrorMessage(error, ''),
        color: 'error',
        icon: PROFILE_ICON.failed,
      });
    } finally {
      isSubmitting.value = false;
    }
  }
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="flex items-center gap-2 font-semibold text-highlighted">
        <UIcon
          :name="PROFILE_ICON.password"
          class="size-5 text-primary"
        />

        {{ PROFILE_TEXT.password }}
      </h2>
    </template>

    <UForm
      :schema="passwordChangeSchema"
      :state="state"
      class="flex flex-col gap-4"
      @submit="submit"
    >
      <UFormField
        :label="PROFILE_TEXT.currentPassword"
        name="currentPassword"
      >
        <AuthPasswordInput
          v-model="state.currentPassword"
          :placeholder="PROFILE_TEXT.currentPassword"
          size="md"
        />
      </UFormField>

      <UFormField
        :label="PROFILE_TEXT.newPassword"
        name="password"
      >
        <AuthPasswordInput
          v-model="state.password"
          :placeholder="PROFILE_TEXT.newPassword"
          autocomplete="new-password"
          size="md"
        />
      </UFormField>

      <UFormField
        :label="PROFILE_TEXT.repeatPassword"
        name="repeat"
      >
        <AuthPasswordInput
          v-model="state.repeat"
          :placeholder="PROFILE_TEXT.repeatPassword"
          :icon="AUTH_ICON.repeat"
          autocomplete="new-password"
          size="md"
        />
      </UFormField>

      <div class="flex justify-end">
        <UButton
          :label="PROFILE_TEXT.changePassword"
          :loading="isSubmitting"
          type="submit"
        />
      </div>
    </UForm>
  </UCard>
</template>
