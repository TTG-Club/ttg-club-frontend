<script setup lang="ts">
  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  import { computed } from 'vue';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  // Пункт списка {@li ...} рендерит своё содержимое БЕЗ собственной обёртки:
  // тег <li> навешивает родительский MarkupList (иначе была бы двойная вложенность).
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
