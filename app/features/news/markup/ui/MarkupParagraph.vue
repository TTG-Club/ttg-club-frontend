<script setup lang="ts">
  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  import { computed } from 'vue';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  // Выравнивание абзаца. `left` — значение по умолчанию (класс не нужен), поэтому
  // отдельным тегом `{@p}` абзац хранится только при `center`/`right`.
  const alignClass = computed(() => {
    const align = node.attrs?.align;

    if (align === 'center') {
      return 'text-center';
    }

    if (align === 'right') {
      return 'text-right';
    }

    return undefined;
  });

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
