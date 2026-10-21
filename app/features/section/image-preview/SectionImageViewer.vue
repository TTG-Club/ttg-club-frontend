<script setup lang="ts">
  import { SECTION_ICON, SECTION_TEXT } from '../model';

  /**
   * Картинки записи во весь экран с листанием, как лайтбокс старого SPA.
   */
  const { images, alt } = defineProps<{
    images: Array<string>;
    alt: string;
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const index = ref(0);

  const current = computed(() => images[index.value] ?? images[0]);

  const hasMany = computed(() => images.length > 1);

  // Другая запись — другие картинки, а новое открытие — с первой.
  watch([() => images, isOpen], () => {
    index.value = 0;
  });

  /**
   * Листает картинки по кругу.
   * @param step - на сколько картинок сдвинуться
   */
  function move(step: number) {
    index.value = (index.value + step + images.length) % images.length;
  }

  function showPrevious() {
    move(-1);
  }

  function showNext() {
    move(1);
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="alt"
    fullscreen
  >
    <template #body>
      <div class="flex h-full items-center justify-center gap-2">
        <UButton
          v-if="hasMany"
          :icon="SECTION_ICON.previous"
          :aria-label="SECTION_TEXT.previousImage"
          color="neutral"
          variant="ghost"
          size="xl"
          @click.left.exact.prevent="showPrevious"
        />

        <img
          :src="current"
          :alt="alt"
          class="max-h-full min-w-0 flex-auto object-contain"
        />

        <UButton
          v-if="hasMany"
          :icon="SECTION_ICON.next"
          :aria-label="SECTION_TEXT.nextImage"
          color="neutral"
          variant="ghost"
          size="xl"
          @click.left.exact.prevent="showNext"
        />
      </div>
    </template>
  </UModal>
</template>
