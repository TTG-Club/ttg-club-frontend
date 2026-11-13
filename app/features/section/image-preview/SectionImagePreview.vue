<script setup lang="ts">
  import { SECTION_TEXT } from '../model';
  import SectionImageViewer from './SectionImageViewer.vue';

  /**
   * Круглое превью картинки записи справа от текста. Размер зависит от
   * ширины контейнера-обёртки (@container), а не окна: в узкой ширме
   * картинка мельче и не налезает на текст. По клику картинки
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
      class="float-right mb-4 ml-4 size-30 cursor-pointer overflow-hidden rounded-full @md:mb-8 @md:ml-8 @md:size-45 @2xl:size-50"
      @click.left.exact.prevent="open"
    >
      <img
        decoding="async"
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
