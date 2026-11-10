<script setup lang="ts">
  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  import { computed } from 'vue';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  const isOrdered = computed(() => node.attrs?.type === 'ordered');
  const tag = computed(() => (isOrdered.value ? 'ol' : 'ul'));

  const listClass = computed(() => {
    const baseClass = isOrdered.value ? 'list-decimal' : 'list-disc';

    // my-2 — вертикальный отступ, чтобы список отбивался от соседних абзацев.
    return ['my-2 list-outside pl-6', baseClass];
  });

  function isMarkerNode(value: unknown): value is MarkerNode {
    return (
      typeof value === 'object'
      && value !== null
      && 'type' in value
      && typeof value.type === 'string'
      && value.type !== 'text'
    );
  }

  const liBatches = computed(() => {
    const batches: VNode[][] = [];
    const content = node.content ?? [];

    for (const item of content) {
      if (Array.isArray(item)) {
        batches.push(renderNodes(item));

        continue;
      }

      // Вложенный список
      if (isMarkerNode(item) && item.type === 'list') {
        const nestedList = renderNodes([item]);
        const lastBatch = batches[batches.length - 1];

        if (lastBatch) {
          lastBatch.push(...nestedList);
        } else {
          batches.push(nestedList);
        }

        continue;
      }

      // Обычный элемент
      batches.push(renderNodes([item]));
    }

    return batches;
  });
</script>

<template>
  <component
    :is="tag"
    :class="listClass"
  >
    <li
      v-for="(batch, index) in liBatches"
      :key="index"
      class="not-first:mt-1"
    >
      <component
        :is="vnode"
        v-for="(vnode, vnodeIndex) in batch"
        :key="vnodeIndex"
      />
    </li>
  </component>
</template>
