<script setup lang="ts">
  import {
    parseSvgIcon,
    SCREEN_ICON_FALLBACK,
    SCREEN_ICON_SIZE_CLASS,
  } from '../model';
  import ScreenSvgNode from './ScreenSvgNode.vue';

  /**
   * Иконка раздела ширмы из SVG-разметки базы, как `raw`-иконка старого
   * SPA. Разметка очищается; без иконки выводится обычная.
   */
  const { markup = undefined, size = 'md' } = defineProps<{
    markup?: string | null;
    /** Маленькая — для шапки и плашки окна ширмы. */
    size?: keyof typeof SCREEN_ICON_SIZE_CLASS;
  }>();

  const icon = computed(() => (markup ? parseSvgIcon(markup) : undefined));

  const sizeClass = computed(() => SCREEN_ICON_SIZE_CLASS[size]);
</script>

<template>
  <span
    :class="sizeClass.frame"
    class="flex shrink-0 items-center justify-center text-primary"
  >
    <ScreenSvgNode
      v-if="icon"
      :node="icon"
    />

    <UIcon
      v-else
      :name="SCREEN_ICON_FALLBACK"
      :class="sizeClass.fallback"
    />
  </span>
</template>
