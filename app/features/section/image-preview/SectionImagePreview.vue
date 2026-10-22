<script setup lang="ts">
  import { SECTION_TEXT } from '../model';
  import SectionImageViewer from './SectionImageViewer.vue';

  /**
   * Круглое превью картинки записи справа от текста. По клику картинки
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
      class="float-right mb-8 ml-8 size-50 cursor-pointer overflow-hidden rounded-full max-sm:float-none max-sm:mx-auto max-sm:mb-4 max-sm:block"
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
