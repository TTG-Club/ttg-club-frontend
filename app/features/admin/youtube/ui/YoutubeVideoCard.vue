<script setup lang="ts">
  import type { YoutubeVideo } from '../../model';

  import { HomeYoutubePlayer } from '~home/videos';

  import {
    ADMIN_YOUTUBE_ICON,
    ADMIN_YOUTUBE_TEXT,
    YOUTUBE_DATE_FORMAT,
  } from '../../model';
  import YoutubeEditModal from './YoutubeEditModal.vue';

  /** Ролик в админке: плеер, название, дата, показ на главной и действия. */
  const {
    video,
    canToggle,
    isBusy = false,
  } = defineProps<{
    video: YoutubeVideo;
    /** Можно ли сейчас переключить показ: на главной есть предел. */
    canToggle: boolean;
    isBusy?: boolean;
  }>();

  const emit = defineEmits<{
    'toggle-active': [isActive: boolean];
    'remove': [];
    'saved': [];
  }>();

  const isEditOpen = ref(false);
  const isDeleteOpen = ref(false);

  const createdLabel = useDateFormat(() => video.created, YOUTUBE_DATE_FORMAT);

  const hasCreated = computed(
    () => !!video.created && !Number.isNaN(Date.parse(video.created)),
  );

  const createdText = computed(
    () => `${ADMIN_YOUTUBE_TEXT.added} ${createdLabel.value}`,
  );

  /** Включить ролик нельзя, когда главная заполнена; выключить можно всегда. */
  const isSwitchDisabled = computed(() => isBusy || !canToggle);

  function handleToggle(value: boolean): void {
    emit('toggle-active', value);
  }

  function openEdit(): void {
    isEditOpen.value = true;
  }

  function openDelete(): void {
    isDeleteOpen.value = true;
  }

  function closeDelete(): void {
    isDeleteOpen.value = false;
  }

  function confirmDelete(): void {
    isDeleteOpen.value = false;
    emit('remove');
  }

  function handleSaved(): void {
    emit('saved');
  }
</script>

<template>
  <UCard :ui="{ body: 'flex flex-col gap-3 p-0 sm:p-0' }">
    <HomeYoutubePlayer
      :key="video.id"
      :video="video"
    />

    <div class="flex flex-col gap-3 px-4 pb-4">
      <div class="flex items-start gap-2">
        <h3
          class="line-clamp-2 min-w-0 flex-1 font-semibold text-highlighted"
          :title="video.name"
        >
          {{ video.name }}
        </h3>

        <UTooltip :text="ADMIN_YOUTUBE_TEXT.edit">
          <UButton
            :icon="ADMIN_YOUTUBE_ICON.edit"
            :aria-label="ADMIN_YOUTUBE_TEXT.edit"
            color="neutral"
            variant="ghost"
            size="sm"
            :disabled="isBusy"
            @click.left.exact.prevent="openEdit"
          />
        </UTooltip>

        <UTooltip :text="ADMIN_YOUTUBE_TEXT.delete">
          <UButton
            :icon="ADMIN_YOUTUBE_ICON.delete"
            :aria-label="ADMIN_YOUTUBE_TEXT.delete"
            color="error"
            variant="ghost"
            size="sm"
            :loading="isBusy"
            @click.left.exact.prevent="openDelete"
          />
        </UTooltip>
      </div>

      <p
        v-if="hasCreated"
        class="text-sm text-muted"
      >
        {{ createdText }}
      </p>

      <USwitch
        :model-value="video.active"
        :label="ADMIN_YOUTUBE_TEXT.showOnHome"
        :disabled="isSwitchDisabled"
        @update:model-value="handleToggle"
      />
    </div>

    <YoutubeEditModal
      v-model:open="isEditOpen"
      :video="video"
      @saved="handleSaved"
    />

    <UModal
      v-model:open="isDeleteOpen"
      :title="ADMIN_YOUTUBE_TEXT.deleteTitle"
      :description="ADMIN_YOUTUBE_TEXT.deleteDescription"
      :ui="{ content: 'max-w-sm', footer: 'justify-end' }"
    >
      <template #footer>
        <UButton
          :label="ADMIN_YOUTUBE_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="closeDelete"
        />

        <UButton
          :label="ADMIN_YOUTUBE_TEXT.delete"
          :icon="ADMIN_YOUTUBE_ICON.delete"
          color="error"
          @click.left.exact.prevent="confirmDelete"
        />
      </template>
    </UModal>
  </UCard>
</template>
