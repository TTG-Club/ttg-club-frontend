<script setup lang="ts">
  import type { ContentDescription } from '../model';

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
   * разворачиваются, чтобы не вкладывать `<p>` в `<p>`. `content` — описание
   * как его отдаёт API, пока сущности переводятся на разметку: строка — HTML,
   * массив — разметка.
   */
  const {
    html = '',
    markup = null,
    content = null,
    tag = 'div',
    inline = false,
  } = defineProps<{
    html?: string;
    markup?: ReadonlyArray<string> | null;
    content?: ContentDescription | null;
    tag?: string;
    inline?: boolean;
  }>();

  const blocks = computed(() => (Array.isArray(content) ? content : markup));

  const nodes = computed(() => {
    if (blocks.value) {
      return inline
        ? markupToInlineContent(blocks.value)
        : markupToContent(blocks.value);
    }

    return parseContent(typeof content === 'string' ? content : html);
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
