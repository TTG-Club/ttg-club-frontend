<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui';

  import type { YoutubeEditInput, YoutubeVideo } from '../../model';

  import { getApiErrorMessage } from '~user/model';

  import {
    ADMIN_YOUTUBE_ICON,
    ADMIN_YOUTUBE_TEXT,
    updateYoutubeVideo,
    YOUTUBE_NAME_MAX_LENGTH,
    youtubeEditSchema,
  } from '../../model';

  /** Окно правки ролика: меняется только название. */
  const { video } = defineProps<{
    video: YoutubeVideo;
  }>();

  const emit = defineEmits<{
    saved: [];
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const toast = useToast();

  const state = reactive<YoutubeEditInput>({ name: video.name });
  const isSubmitting = ref(false);

  // Окно открывается с текущим названием, а не с прошлым черновиком
  watch(isOpen, (opened) => {
    if (opened) {
      state.name = video.name;
    }
  });

  function close(): void {
    isOpen.value = false;
  }

  async function submit(
    event: FormSubmitEvent<YoutubeEditInput>,
  ): Promise<void> {
    isSubmitting.value = true;

    try {
      await updateYoutubeVideo({ ...video, name: event.data.name });

      toast.add({
        title: ADMIN_YOUTUBE_TEXT.savedToast,
        color: 'success',
        icon: ADMIN_YOUTUBE_ICON.success,
      });

      isOpen.value = false;
      emit('saved');
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
    :title="ADMIN_YOUTUBE_TEXT.editTitle"
    :ui="{ content: 'max-w-lg' }"
  >
    <template #body>
      <UForm
        :id="`youtube-edit-${video.id}`"
        :schema="youtubeEditSchema"
        :state="state"
        @submit="submit"
      >
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
            autofocus
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
          :label="ADMIN_YOUTUBE_TEXT.save"
          :loading="isSubmitting"
          type="submit"
          :form="`youtube-edit-${video.id}`"
        />
      </div>
    </template>
  </UModal>
</template>
