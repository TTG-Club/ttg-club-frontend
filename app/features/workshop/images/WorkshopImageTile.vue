<script setup lang="ts">
  import { WORKSHOP_IMAGE_ICON, WORKSHOP_IMAGE_TEXT } from '../model';

  /** Картинка галереи с кнопками перестановки и удаления. */
  const { url, position, isFirst, isLast, isDisabled } = defineProps<{
    url: string;
    /** Номер картинки с единицы: подпись и текст для скринридеров. */
    position: number;
    isFirst: boolean;
    isLast: boolean;
    isDisabled: boolean;
  }>();

  const emit = defineEmits<{
    move: [offset: -1 | 1];
    remove: [];
  }>();

  const imageAlt = computed(
    () => `${WORKSHOP_IMAGE_TEXT.imageAlt} ${position}`,
  );

  function moveUp(): void {
    emit('move', -1);
  }

  function moveDown(): void {
    emit('move', 1);
  }

  function handleRemove(): void {
    emit('remove');
  }
</script>

<template>
  <li
    class="flex flex-col overflow-hidden rounded-md border border-default bg-elevated/50"
  >
    <a
      :href="url"
      :title="WORKSHOP_IMAGE_TEXT.open"
      target="_blank"
      rel="noopener"
      class="block aspect-square bg-muted"
    >
      <img
        :src="url"
        :alt="imageAlt"
        loading="lazy"
        class="size-full object-contain"
      />
    </a>

    <div class="flex items-center justify-between gap-1 px-1 py-1">
      <span class="px-1 text-xs text-muted">{{ position }}</span>

      <div class="flex items-center gap-1">
        <UButton
          :icon="WORKSHOP_IMAGE_ICON.moveUp"
          :aria-label="WORKSHOP_IMAGE_TEXT.moveUp"
          :disabled="isDisabled || isFirst"
          color="neutral"
          variant="ghost"
          size="xs"
          @click.left.exact.prevent="moveUp"
        />

        <UButton
          :icon="WORKSHOP_IMAGE_ICON.moveDown"
          :aria-label="WORKSHOP_IMAGE_TEXT.moveDown"
          :disabled="isDisabled || isLast"
          color="neutral"
          variant="ghost"
          size="xs"
          @click.left.exact.prevent="moveDown"
        />

        <UButton
          :icon="WORKSHOP_IMAGE_ICON.remove"
          :aria-label="WORKSHOP_IMAGE_TEXT.remove"
          :disabled="isDisabled"
          color="error"
          variant="ghost"
          size="xs"
          @click.left.exact.prevent="handleRemove"
        />
      </div>
    </div>
  </li>
</template>
