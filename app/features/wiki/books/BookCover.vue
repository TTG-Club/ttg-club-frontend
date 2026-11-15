<script setup lang="ts">
  import { SectionImageViewer } from '~section/image-preview';
  import { SECTION_TEXT } from '~section/model';

  /**
   * Обложка источника справа от описания. Обложки книг вертикальные,
   * поэтому не круглое превью, а прямоугольник 3:4. Размер зависит от
   * ширины контейнера, а по клику обложка открывается во весь экран.
   */
  const { url, alt } = defineProps<{
    url: string;
    alt: string;
  }>();

  const isOpen = ref(false);

  const images = computed(() => [url]);

  function open(): void {
    isOpen.value = true;
  }
</script>

<template>
  <button
    :aria-label="SECTION_TEXT.openImage"
    type="button"
    class="float-right mb-4 ml-4 aspect-3/4 w-28 cursor-zoom-in overflow-hidden rounded-lg border border-default bg-elevated shadow-sm @md:mb-6 @md:ml-6 @md:w-40 @2xl:w-48"
    @click.left.exact.prevent="open"
  >
    <img
      :src="url"
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
