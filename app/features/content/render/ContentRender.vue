<script setup lang="ts">
  import { parseContent } from '../model';
  import ContentNodes from './ContentNodes.vue';

  /**
   * HTML-контент из базы: замена `RawContent` старого SPA, только без
   * компиляции шаблона Vue. Разметка очищается, а теги `dice-roller` и
   * `detail-tooltip` выводятся компонентами.
   */
  const { html, tag = 'div' } = defineProps<{
    html: string;
    tag?: string;
  }>();

  const nodes = computed(() => parseContent(html));
</script>

<template>
  <component
    :is="tag"
    class="content-render"
  >
    <ContentNodes :nodes="nodes" />
  </component>
</template>
