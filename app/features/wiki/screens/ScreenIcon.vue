<script setup lang="ts">
  import { parseSvgIcon, SCREEN_ICON_FALLBACK } from '../model';
  import ScreenSvgNode from './ScreenSvgNode.vue';

  /**
   * Иконка раздела ширмы из SVG-разметки базы, как `raw`-иконка старого
   * SPA. Разметка очищается; без иконки выводится обычная.
   */
  const { markup = undefined } = defineProps<{
    markup?: string | null;
  }>();

  const icon = computed(() => (markup ? parseSvgIcon(markup) : undefined));
</script>

<template>
  <span class="flex size-10 shrink-0 items-center justify-center text-primary">
    <ScreenSvgNode
      v-if="icon"
      :node="icon"
    />

    <UIcon
      v-else
      :name="SCREEN_ICON_FALLBACK"
      class="size-8"
    />
  </span>
</template>
