<script setup lang="ts">
  import {
    getErrorStatus,
    SIGN_IN_FORM,
    SIGN_IN_TOASTS,
    WRONG_CREDENTIALS_STATUS,
  } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { signIn } = useUser();
  const toast = useToast();

  const isPasswordVisible = ref(false);
  const isSubmitting = ref(false);

  const state = reactive({
    usernameOrEmail: '',
    password: '',
    remember: true,
  });

  const passwordType = computed(() =>
    isPasswordVisible.value ? 'text' : 'password',
  );

  const passwordToggleIcon = computed(() =>
    isPasswordVisible.value ? 'tabler:eye-off' : 'tabler:eye',
  );

  const passwordToggleLabel = computed(() =>
    isPasswordVisible.value
      ? SIGN_IN_FORM.hidePasswordLabel
      : SIGN_IN_FORM.showPasswordLabel,
  );

  function togglePasswordVisibility() {
    isPasswordVisible.value = !isPasswordVisible.value;
  }

  function showError(description: string) {
    toast.add({
      title: description,
      color: 'error',
      icon: 'tabler:user-exclamation',
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
        icon: 'tabler:user-check',
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
          icon="tabler:user"
          autocapitalize="off"
          autocomplete="username"
          autocorrect="off"
          autofocus
        />
      </UFormField>

      <UFormField name="password">
        <UInput
          v-model="state.password"
          :type="passwordType"
          :placeholder="SIGN_IN_FORM.passwordPlaceholder"
          :ui="{ trailing: 'pe-1' }"
          class="w-full"
          size="lg"
          icon="tabler:lock"
          autocomplete="current-password"
        >
          <template #trailing>
            <UButton
              :icon="passwordToggleIcon"
              :aria-label="passwordToggleLabel"
              :aria-pressed="isPasswordVisible"
              color="neutral"
              variant="link"
              size="sm"
              @click.left.exact.prevent="togglePasswordVisibility"
            />
          </template>
        </UInput>
      </UFormField>

      <UCheckbox
        v-model="state.remember"
        :label="SIGN_IN_FORM.rememberLabel"
      />

      <UButton
        :label="SIGN_IN_FORM.submitLabel"
        :loading="isSubmitting"
        type="submit"
        size="lg"
        block
      />
    </UForm>
  </div>
</template>
