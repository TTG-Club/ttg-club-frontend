<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui';

  import type { YoutubeCreateData, YoutubeCreateInput } from '../../model';

  import { getApiErrorMessage } from '~user/model';

  import {
    ADMIN_YOUTUBE_ICON,
    ADMIN_YOUTUBE_TEXT,
    createYoutubeVideo,
    YOUTUBE_NAME_MAX_LENGTH,
    youtubeCreateSchema,
  } from '../../model';

  /** Окно добавления ролика: ссылка или ID и название. */
  const emit = defineEmits<{
    added: [];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const toast = useToast();

  const state = reactive<YoutubeCreateInput>({ id: '', name: '' });
  const isSubmitting = ref(false);

  // Окно каждый раз открывается с пустой формой
  watch(isOpen, (opened) => {
    if (opened) {
      state.id = '';
      state.name = '';
    }
  });

  function close(): void {
    isOpen.value = false;
  }

  async function submit(
    event: FormSubmitEvent<YoutubeCreateData>,
  ): Promise<void> {
    isSubmitting.value = true;

    try {
      await createYoutubeVideo(event.data);

      toast.add({
        title: ADMIN_YOUTUBE_TEXT.addedToast,
        color: 'success',
        icon: ADMIN_YOUTUBE_ICON.success,
      });

      isOpen.value = false;
      emit('added');
    } catch (error) {
      toast.add({
        title: ADMIN_YOUTUBE_TEXT.actionError,
        description: getApiErrorMessage(error, '') || undefined,
        color: 'error',
        icon: ADMIN_YOUTUBE_ICON.error,
      });
    } finally {
      isSubmitting.value = false;
    }
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="ADMIN_YOUTUBE_TEXT.addTitle"
    :ui="{ content: 'max-w-lg' }"
  >
    <template #body>
      <UForm
        id="youtube-add-form"
        :schema="youtubeCreateSchema"
        :state="state"
        class="flex flex-col gap-4"
        @submit="submit"
      >
        <UFormField
          :label="ADMIN_YOUTUBE_TEXT.idLabel"
          :description="ADMIN_YOUTUBE_TEXT.idHelp"
          name="id"
          required
        >
          <UInput
            v-model="state.id"
            :placeholder="ADMIN_YOUTUBE_TEXT.idPlaceholder"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField
          :label="ADMIN_YOUTUBE_TEXT.nameLabel"
          name="name"
          required
        >
          <UInput
            v-model="state.name"
            :placeholder="ADMIN_YOUTUBE_TEXT.namePlaceholder"
            :maxlength="YOUTUBE_NAME_MAX_LENGTH"
            class="w-full"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="ADMIN_YOUTUBE_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="close"
        />

        <UButton
          :label="ADMIN_YOUTUBE_TEXT.add"
          :icon="ADMIN_YOUTUBE_ICON.add"
          :loading="isSubmitting"
          type="submit"
          form="youtube-add-form"
        />
      </div>
    </template>
  </UModal>
</template>
