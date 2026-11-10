<script setup lang="ts">
  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  import { getHeadingAnchor } from '../anchors';
  import {
    MARKUP_ALIGN_CLASSES,
    MARKUP_HEADING_BASE_CLASS,
    MARKUP_HEADING_LEVEL_CLASSES,
    MARKUP_HEADING_TAGS,
  } from '../consts';
  import { clampHeadingLevel } from '../utils';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  // Уровень 1–4 клампим, а не бросаем: заголовок рендерится вне try/catch
  // MarkupRender, и ошибка из-за одного плохого `level:` уронила бы весь текст
  const level = computed(() => clampHeadingLevel(node.attrs?.level));

  const tag = computed(() => MARKUP_HEADING_TAGS[level.value]);

  const anchorId = computed(() => getHeadingAnchor(node));

  const headingClass = computed(() => [
    MARKUP_HEADING_BASE_CLASS,
    MARKUP_HEADING_LEVEL_CLASSES[level.value],
    MARKUP_ALIGN_CLASSES[String(node.attrs?.align)],
  ]);

  const children = computed(() =>
    node.content ? renderNodes(node.content) : [],
  );
</script>

<template>
  <component
    :is="tag"
    :id="anchorId"
    :class="headingClass"
  >
    <component
      :is="vnode"
      v-for="(vnode, index) in children"
      :key="index"
    />
  </component>
</template>
