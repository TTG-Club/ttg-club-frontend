<script setup lang="ts">
  import { useBookCover } from '../composables';
  import {
    BOOK_COVER_TEXT,
    WORKSHOP_IMAGE_ICON,
    WORKSHOP_IMAGE_TEXT,
  } from '../model';

  /**
   * Обложка источника: загрузка и удаление сохраняются сразу, отдельно
   * от формы книги.
   */
  const { source, initialCover } = defineProps<{
    source: string;
    initialCover: string | null;
  }>();

  const { cover, isBusy, pickFile, remove } = useBookCover(
    () => source,
    initialCover,
  );

  /** Файла по адресу может не оказаться: тогда показываем заглушку. */
  const isBroken = ref(false);
  const isConfirmOpen = ref(false);

  const isCoverVisible = computed(() => !!cover.value && !isBroken.value);

  watch(cover, () => {
    isBroken.value = false;
  });

  function handleError(): void {
    isBroken.value = true;
  }

  function askRemove(): void {
    isConfirmOpen.value = true;
  }

  function closeConfirm(): void {
    isConfirmOpen.value = false;
  }

  async function confirmRemove(): Promise<void> {
    isConfirmOpen.value = false;
    await remove();
  }
</script>

<template>
  <section class="flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <h2 class="flex items-center gap-2 font-semibold text-highlighted">
        <UIcon
          :name="WORKSHOP_IMAGE_ICON.title"
          class="size-5 text-primary"
        />

        {{ BOOK_COVER_TEXT.title }}
      </h2>

      <p class="text-sm text-muted">
        {{ BOOK_COVER_TEXT.description }}
      </p>
    </div>

    <div class="flex flex-wrap items-end gap-3">
      <div
        class="flex aspect-3/4 w-40 items-center justify-center overflow-hidden rounded-md border border-default bg-muted"
      >
        <img
          v-if="isCoverVisible"
          :src="cover"
          :alt="BOOK_COVER_TEXT.alt"
          class="size-full object-cover"
          @error="handleError"
        />

        <span
          v-else
          class="flex flex-col items-center gap-2 p-2 text-center text-sm text-muted"
        >
          <UIcon
            :name="WORKSHOP_IMAGE_ICON.empty"
            class="size-6"
          />

          {{ BOOK_COVER_TEXT.missing }}
        </span>
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          :label="BOOK_COVER_TEXT.upload"
          :icon="WORKSHOP_IMAGE_ICON.upload"
          :loading="isBusy"
          :disabled="isBusy"
          color="neutral"
          variant="subtle"
          @click.left.exact.prevent="pickFile"
        />

        <UButton
          v-if="cover"
          :label="BOOK_COVER_TEXT.remove"
          :icon="WORKSHOP_IMAGE_ICON.remove"
          :disabled="isBusy"
          color="error"
          variant="ghost"
          @click.left.exact.prevent="askRemove"
        />
      </div>
    </div>

    <UModal
      v-model:open="isConfirmOpen"
      :title="BOOK_COVER_TEXT.removeTitle"
      :description="BOOK_COVER_TEXT.removeDescription"
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
          :label="BOOK_COVER_TEXT.remove"
          :icon="WORKSHOP_IMAGE_ICON.remove"
          color="error"
          @click.left.exact.prevent="confirmRemove"
        />
      </template>
    </UModal>
  </section>
</template>
