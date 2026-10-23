<script setup lang="ts">
  import { SECTION_TEXT } from '../model';
  import SectionImageViewer from './SectionImageViewer.vue';

  /**
   * Квадратная обложка записи в колонке свойств. По клику картинки
   * открываются во весь экран с листанием.
   */
  const { images, alt } = defineProps<{
    images: Array<string>;
    alt: string;
  }>();

  const isOpen = ref(false);

  function open() {
    isOpen.value = true;
  }
</script>

<template>
  <template v-if="images.length">
    <button
      :aria-label="SECTION_TEXT.openImage"
      type="button"
      class="aspect-square w-full cursor-zoom-in overflow-hidden rounded-lg border border-default bg-elevated @min-xl:@max-3xl:w-50 @min-xl:@max-3xl:flex-none"
      @click.left.exact.prevent="open"
    >
      <img
        :src="images[0]"
        :alt="alt"
        loading="lazy"
        class="size-full object-cover"
      />
    </button>

    <SectionImageViewer
      v-model:open="isOpen"
      :images="images"
      :alt="alt"
    />
  </template>
</template>
