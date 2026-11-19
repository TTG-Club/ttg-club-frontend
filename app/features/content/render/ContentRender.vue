<script setup lang="ts">
  import {
    markupToContent,
    markupToInlineContent,
    parseContent,
  } from '../model';
  import ContentNodes from './ContentNodes.vue';

  /**
   * Описание записи: HTML старой базы (замена `RawContent` старого SPA, без
   * компиляции шаблона Vue — разметка очищается, `dice-roller` и
   * `detail-tooltip` выводятся компонентами) либо разметка core-api — массив
   * строк-блоков, который разбирается в то же дерево узлов, без HTML.
   * `inline` — для вывода внутри строки (`tag="span"`): абзацы разметки
   * разворачиваются, чтобы не вкладывать `<p>` в `<p>`.
   */
  const {
    html = '',
    markup = null,
    tag = 'div',
    inline = false,
  } = defineProps<{
    html?: string;
    markup?: ReadonlyArray<string> | null;
    tag?: string;
    inline?: boolean;
  }>();

  const nodes = computed(() => {
    if (markup) {
      return inline ? markupToInlineContent(markup) : markupToContent(markup);
    }

    return parseContent(html);
  });
</script>

<template>
  <component
    :is="tag"
    class="content-render"
  >
    <ContentNodes :nodes="nodes" />
  </component>
</template>
