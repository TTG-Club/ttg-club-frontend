<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui';

  import type { SignUpState } from '../../model';

  import { AuthPasswordInput } from '~user/password-input';

  import {
    AUTH_ICON,
    AUTH_VALIDATION,
    checkAccountExists,
    getApiErrorMessage,
    getErrorStatus,
    LEGAL_DOCUMENTS,
    PASSWORD_SPECIAL_CHARACTERS,
    SIGN_UP_FORM,
    SIGN_UP_TOASTS,
    signUp,
    signUpSchema,
    TAKEN_STATUS,
  } from '../../model';

  /**
   * Регистрация: имя, почта, пароль и две галочки согласия. Занятые имя и
   * почта подсвечиваются у полей до отправки.
   */
  const emit = defineEmits<{
    'sign-in': [];
  }>();

  const toast = useToast();
  const form = useTemplateRef('form');
  const passwordField = useTemplateRef<HTMLDivElement>('passwordField');
  const { focused: isPasswordFocused } = useFocusWithin(passwordField);

  const isSubmitting = ref(false);

  const state = reactive<SignUpState>({
    username: '',
    email: '',
    password: '',
    repeat: '',
    offerAccepted: false,
    personalDataConsent: false,
  });

  // Список спецсимволов виден, пока пароль вводят
  const passwordHelp = computed(() =>
    isPasswordFocused.value
      ? `${SIGN_UP_FORM.specialCharacters}: ${PASSWORD_SPECIAL_CHARACTERS}`
      : undefined,
  );

  const isConsentGiven = computed(
    () => state.offerAccepted && state.personalDataConsent,
  );

  /**
   * Проверяет, свободно ли поле; занятое получает подсказку.
   * @param field - имя или почта
   * @returns свободно ли поле
   */
  async function isAvailable(field: 'username' | 'email'): Promise<boolean> {
    try {
      await checkAccountExists(field, state[field]);

      return true;
    } catch (error) {
      if (getErrorStatus(error) !== TAKEN_STATUS) {
        throw error;
      }

      form.value?.setErrors(
        [
          {
            name: field,
            message:
              field === 'username'
                ? AUTH_VALIDATION.usernameTaken
                : AUTH_VALIDATION.emailTaken,
          },
        ],
        field,
      );

      return false;
    }
  }

  /**
   * Отправляет форму, если имя и почта свободны.
   * @param event - проверенная форма
   */
  async function submit(event: FormSubmitEvent<SignUpState>): Promise<void> {
    isSubmitting.value = true;

    try {
      const checks = await Promise.all([
        isAvailable('username'),
        isAvailable('email'),
      ]);

      if (checks.includes(false)) {
        return;
      }

      await signUp(event.data);

      toast.add({
        title: SIGN_UP_TOASTS.success,
        description: SIGN_UP_TOASTS.successDescription,
        color: 'success',
        icon: AUTH_ICON.success,
      });

      emit('sign-in');
    } catch (error) {
      toast.add({
        title: SIGN_UP_TOASTS.failed,
        description: getApiErrorMessage(
          error,
          SIGN_UP_TOASTS.failedDescription,
        ),
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
        {{ SIGN_UP_FORM.title }}
      </h2>

      <p class="text-sm text-muted">{{ SIGN_UP_FORM.description }}</p>
    </div>

    <UForm
      ref="form"
      :schema="signUpSchema"
      :state="state"
      class="flex flex-col gap-4"
      @submit="submit"
    >
      <UFormField name="username">
        <UInput
          v-model="state.username"
          :placeholder="SIGN_UP_FORM.usernamePlaceholder"
          :icon="AUTH_ICON.user"
          class="w-full"
          size="lg"
          autocapitalize="off"
          autocomplete="username"
          autocorrect="off"
          autofocus
        />
      </UFormField>

      <UFormField name="email">
        <UInput
          v-model="state.email"
          :placeholder="SIGN_UP_FORM.emailPlaceholder"
          :icon="AUTH_ICON.email"
          type="email"
          class="w-full"
          size="lg"
          autocapitalize="off"
          autocomplete="email"
          autocorrect="off"
        />
      </UFormField>

      <UFormField
        :help="passwordHelp"
        name="password"
      >
        <div ref="passwordField">
          <AuthPasswordInput
            v-model="state.password"
            :placeholder="SIGN_UP_FORM.passwordPlaceholder"
            autocomplete="new-password"
          />
        </div>
      </UFormField>

      <UFormField name="repeat">
        <AuthPasswordInput
          v-model="state.repeat"
          :placeholder="SIGN_UP_FORM.repeatPlaceholder"
          :icon="AUTH_ICON.repeat"
          autocomplete="new-password"
        />
      </UFormField>

      <UFormField name="offerAccepted">
        <UCheckbox v-model="state.offerAccepted">
          <template #label>
            {{ SIGN_UP_FORM.offerBefore }}

            <ULink
              :to="LEGAL_DOCUMENTS.offerUrl"
              target="_blank"
              class="text-primary"
            >
              {{ SIGN_UP_FORM.offerLink }}
            </ULink>
          </template>
        </UCheckbox>
      </UFormField>

      <UFormField name="personalDataConsent">
        <UCheckbox v-model="state.personalDataConsent">
          <template #label>
            {{ SIGN_UP_FORM.privacyBefore }}

            <ULink
              :to="LEGAL_DOCUMENTS.privacyUrl"
              target="_blank"
              class="text-primary"
            >
              {{ SIGN_UP_FORM.privacyLink }}
            </ULink>
          </template>
        </UCheckbox>
      </UFormField>

      <UButton
        :label="SIGN_UP_FORM.submitLabel"
        :loading="isSubmitting"
        :disabled="!isConsentGiven"
        type="submit"
        size="lg"
        block
      />
    </UForm>

    <div
      class="flex flex-wrap items-center justify-center gap-x-2 border-t border-default pt-5 text-sm text-muted"
    >
      {{ SIGN_UP_FORM.hasAccount }}

      <UButton
        :label="SIGN_UP_FORM.signIn"
        variant="link"
        class="p-0"
        @click.left.exact.prevent="openSignIn"
      />
    </div>
  </div>
</template>
