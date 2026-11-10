<script setup lang="ts">
  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  // Пункт списка `{@li ...}` рендерит содержимое без своей обёртки: пункт
  // списка навешивает родительский MarkupList, иначе была бы двойная вложенность
  const children = computed(() =>
    node.content ? renderNodes(node.content) : [],
  );
</script>

<template>
  <component
    :is="vnode"
    v-for="(vnode, index) in children"
    :key="index"
  />
</template>
