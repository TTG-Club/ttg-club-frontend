<script setup lang="ts">
  import { SECTION_ICON, SECTION_TEXT } from '../model';
  import SectionImageViewer from './SectionImageViewer.vue';

  /**
   * Квадратная обложка записи в колонке свойств. Картинки — портреты
   * в полный рост, поэтому обложка прижата к верху и показывает голову
   * и торс. По клику картинки открываются во весь экран с листанием.
   * Как на new.ttg.club, поверх обложки лупа и число картинок: не все
   * догадываются, что она открывает галерею.
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
      class="group relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-lg border border-default bg-elevated @min-xl:@max-3xl:w-50 @min-xl:@max-3xl:flex-none"
      @click.left.exact.prevent="open"
    >
      <img
        :src="images[0]"
        :alt="alt"
        loading="lazy"
        class="size-full object-cover object-top"
      />

      <span
        v-if="images.length > 1"
        class="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-default/80 px-2 py-1 text-xs font-medium text-highlighted shadow-sm ring ring-default backdrop-blur-sm"
        aria-hidden="true"
      >
        <UIcon
          :name="SECTION_ICON.imageCount"
          class="size-4"
        />

        {{ images.length }}
      </span>

      <span
        class="pointer-events-none absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full bg-default/80 text-highlighted shadow-sm ring ring-default backdrop-blur-sm transition-transform duration-200 group-hover:scale-110"
        aria-hidden="true"
      >
        <UIcon
          :name="SECTION_ICON.zoom"
          class="size-4.5"
        />
      </span>
    </button>

    <SectionImageViewer
      v-model:open="isOpen"
      :images="images"
      :alt="alt"
    />
  </template>
</template>
