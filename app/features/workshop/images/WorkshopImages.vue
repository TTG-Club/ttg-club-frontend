<script setup lang="ts">
  import type { WorkshopImageType } from '../model';

  import { useWorkshopImages } from '../composables';
  import {
    WORKSHOP_ICON,
    WORKSHOP_IMAGE_ICON,
    WORKSHOP_IMAGE_TEXT,
  } from '../model';
  import WorkshopImageTile from './WorkshopImageTile.vue';

  /**
   * Картинки записи: обложка карточки (у классов и рас) и галерея.
   * Изменения уходят на бэкенд сразу, отдельно от формы записи.
   */
  const { type, entryId } = defineProps<{
    type: WorkshopImageType;
    entryId: number;
  }>();

  const {
    gallery,
    cover,
    hasCover,
    isLoading,
    isError,
    isBusy,
    isGalleryFull,
    load,
    pickGalleryFiles,
    pickCoverFile,
    move,
    remove,
  } = useWorkshopImages(
    () => type,
    () => entryId,
  );

  /** Обложки по адресу может не быть: тогда показываем заглушку. */
  const isCoverBroken = ref(false);
  const confirmIndex = ref<number>();

  const coverUrl = computed(() => cover.value?.url);
  const canUploadCover = computed(() => !!cover.value?.editable);

  const coverHint = computed(() =>
    canUploadCover.value
      ? WORKSHOP_IMAGE_TEXT.coverDescription
      : WORKSHOP_IMAGE_TEXT.coverInherited,
  );

  const isCoverVisible = computed(
    () => !!coverUrl.value && !isCoverBroken.value,
  );

  const isConfirmOpen = computed({
    get: () => confirmIndex.value !== undefined,
    set: (value) => {
      if (!value) {
        confirmIndex.value = undefined;
      }
    },
  });

  watch(coverUrl, () => {
    isCoverBroken.value = false;
  });

  function handleCoverError(): void {
    isCoverBroken.value = true;
  }

  /**
   * Перестановка картинки.
   * @param index - номер картинки
   * @param offset - `-1` — раньше, `1` — позже
   */
  async function handleMove(index: number, offset: -1 | 1): Promise<void> {
    await move(index, offset);
  }

  /**
   * Спрашивает подтверждение перед удалением.
   * @param index - номер картинки
   */
  function askRemove(index: number): void {
    confirmIndex.value = index;
  }

  function closeConfirm(): void {
    confirmIndex.value = undefined;
  }

  async function confirmRemove(): Promise<void> {
    const index = confirmIndex.value;

    confirmIndex.value = undefined;

    if (index !== undefined) {
      await remove(index);
    }
  }

  async function handleRetry(): Promise<void> {
    await load();
  }

  onMounted(load);
</script>

<template>
  <section class="flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <h2 class="flex items-center gap-2 font-semibold text-highlighted">
        <UIcon
          :name="WORKSHOP_IMAGE_ICON.title"
          class="size-5 text-primary"
        />

        {{ WORKSHOP_IMAGE_TEXT.title }}
      </h2>

      <p class="text-sm text-muted">
        {{ WORKSHOP_IMAGE_TEXT.description }}
      </p>
    </div>

    <div
      v-if="isLoading"
      class="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      <USkeleton class="aspect-square w-full" />

      <USkeleton class="aspect-square w-full" />
    </div>

    <UAlert
      v-else-if="isError"
      :title="WORKSHOP_IMAGE_TEXT.loadError"
      :icon="WORKSHOP_ICON.error"
      color="error"
      variant="subtle"
      :actions="[{ label: WORKSHOP_IMAGE_TEXT.retry, onClick: handleRetry }]"
    />

    <template v-else>
      <div
        v-if="hasCover"
        class="flex flex-col gap-2"
      >
        <h3 class="text-sm font-semibold text-highlighted">
          {{ WORKSHOP_IMAGE_TEXT.coverTitle }}
        </h3>

        <p class="text-sm text-muted">
          {{ coverHint }}
        </p>

        <div class="flex flex-wrap items-end gap-3">
          <div
            class="flex aspect-video w-64 max-w-full items-center justify-center overflow-hidden rounded-md border border-default bg-muted"
          >
            <img
              v-if="isCoverVisible"
              :src="coverUrl"
              :alt="WORKSHOP_IMAGE_TEXT.coverAlt"
              class="size-full object-cover"
              @error="handleCoverError"
            />

            <span
              v-else
              class="flex items-center gap-2 text-sm text-muted"
            >
              <UIcon
                :name="WORKSHOP_IMAGE_ICON.empty"
                class="size-5"
              />

              {{ WORKSHOP_IMAGE_TEXT.coverMissing }}
            </span>
          </div>

          <UButton
            v-if="canUploadCover"
            :label="WORKSHOP_IMAGE_TEXT.uploadCover"
            :icon="WORKSHOP_IMAGE_ICON.upload"
            :loading="isBusy"
            :disabled="isBusy"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="pickCoverFile"
          />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-col gap-1">
            <h3 class="text-sm font-semibold text-highlighted">
              {{ WORKSHOP_IMAGE_TEXT.galleryTitle }}
            </h3>

            <p class="text-sm text-muted">
              {{ WORKSHOP_IMAGE_TEXT.galleryDescription }}
            </p>
          </div>

          <UButton
            :label="WORKSHOP_IMAGE_TEXT.upload"
            :icon="WORKSHOP_IMAGE_ICON.upload"
            :loading="isBusy"
            :disabled="isBusy || isGalleryFull"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="pickGalleryFiles"
          />
        </div>

        <p
          v-if="!gallery.length"
          class="text-sm text-muted"
        >
          {{ WORKSHOP_IMAGE_TEXT.galleryEmpty }}
        </p>

        <ul
          v-else
          class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
        >
          <WorkshopImageTile
            v-for="(image, index) in gallery"
            :key="image"
            :url="image"
            :position="index + 1"
            :is-first="index === 0"
            :is-last="index === gallery.length - 1"
            :is-disabled="isBusy"
            @move="handleMove(index, $event)"
            @remove="askRemove(index)"
          />
        </ul>
      </div>
    </template>

    <UModal
      v-model:open="isConfirmOpen"
      :title="WORKSHOP_IMAGE_TEXT.removeTitle"
      :description="WORKSHOP_IMAGE_TEXT.removeDescription"
      :ui="{ content: 'max-w-sm', footer: 'justify-end' }"
    >
      <template #footer>
        <UButton
          :label="WORKSHOP_IMAGE_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="closeConfirm"
        />

        <UButton
          :label="WORKSHOP_IMAGE_TEXT.removeConfirm"
          :icon="WORKSHOP_IMAGE_ICON.remove"
          color="error"
          @click.left.exact.prevent="confirmRemove"
        />
      </template>
    </UModal>
  </section>
</template>
