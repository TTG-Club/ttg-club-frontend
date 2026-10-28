<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui';

  import type { DisplayNameState } from '../model';

  import {
    changeDisplayName,
    DISPLAY_NAME_LIMIT,
    displayNameSchema,
    getApiErrorMessage,
    getRoleLabels,
    PROFILE_ICON,
    PROFILE_TEXT,
  } from '../model';

  /**
   * Личные данные: отображаемое имя можно сменить, логин и почта только для
   * чтения.
   */
  const { user, roles, fetchProfile } = useUser();

  const toast = useToast();

  const isSubmitting = ref(false);

  const state = reactive<DisplayNameState>({ displayName: '' });

  // Без отображаемого имени на сайте показывается логин
  const savedName = computed(
    () => user.value?.displayName || user.value?.username || '',
  );

  const roleLabels = computed(() => getRoleLabels(roles.value));

  const isUnchanged = computed(
    () => state.displayName.trim() === savedName.value,
  );

  // После сохранения профиль перечитывается, и поле встаёт на новое имя
  watch(
    savedName,
    (value) => {
      state.displayName = value;
    },
    { immediate: true },
  );

  /**
   * Сохраняет имя и перечитывает профиль, чтобы оно сменилось везде.
   * @param event - проверенная форма
   */
  async function submit(
    event: FormSubmitEvent<DisplayNameState>,
  ): Promise<void> {
    isSubmitting.value = true;

    try {
      await changeDisplayName(event.data.displayName);
      await fetchProfile();

      toast.add({
        title: PROFILE_TEXT.displayNameSaved,
        color: 'success',
        icon: PROFILE_ICON.saved,
      });
    } catch (error) {
      toast.add({
        title: PROFILE_TEXT.displayNameFailed,
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
          :name="PROFILE_ICON.personal"
          class="size-5 text-primary"
        />

        {{ PROFILE_TEXT.personal }}
      </h2>
    </template>

    <div class="flex flex-col gap-4">
      <UForm
        :schema="displayNameSchema"
        :state="state"
        @submit="submit"
      >
        <UFormField
          :label="PROFILE_TEXT.displayName"
          :description="PROFILE_TEXT.displayNameHelp"
          name="displayName"
        >
          <div class="flex items-start gap-2">
            <UInput
              v-model="state.displayName"
              :placeholder="PROFILE_TEXT.displayNamePlaceholder"
              :maxlength="DISPLAY_NAME_LIMIT.max"
              :icon="PROFILE_ICON.displayName"
              autocomplete="nickname"
              class="flex-1"
            />

            <UButton
              :label="PROFILE_TEXT.save"
              :loading="isSubmitting"
              :disabled="isUnchanged"
              type="submit"
            />
          </div>
        </UFormField>
      </UForm>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField :label="PROFILE_TEXT.username">
          <UInput
            :model-value="user?.username"
            :icon="PROFILE_ICON.username"
            class="w-full"
            disabled
          />
        </UFormField>

        <UFormField :label="PROFILE_TEXT.email">
          <UInput
            :model-value="user?.email ?? ''"
            :icon="PROFILE_ICON.email"
            class="w-full"
            disabled
          />
        </UFormField>
      </div>

      <div class="flex flex-wrap gap-1.5">
        <UBadge
          v-for="label in roleLabels"
          :key="label"
          :label="label"
          color="neutral"
          variant="subtle"
        />
      </div>
    </div>
  </UCard>
</template>
