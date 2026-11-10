<script setup lang="ts">
  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  import { MARKUP_ALIGN_CLASSES } from '../consts';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  // Отдельным маркером `{@p}` абзац хранится только при выравнивании
  // `center`/`right`; `left` — по умолчанию, класс не нужен
  const alignClass = computed(
    () => MARKUP_ALIGN_CLASSES[String(node.attrs?.align)],
  );

  const children = computed(() =>
    node.content ? renderNodes(node.content) : [],
  );
</script>

<template>
  <p :class="alignClass">
    <component
      :is="vnode"
      v-for="(vnode, index) in children"
      :key="index"
    />
  </p>
</template>
