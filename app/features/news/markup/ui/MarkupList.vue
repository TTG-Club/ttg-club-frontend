<script setup lang="ts">
  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  import { MARKUP_LIST_TYPE, MARKUP_ORDERED_LIST_TYPE } from '../consts';
  import { isMarkerNode } from '../utils';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  const isOrdered = computed(
    () => node.attrs?.type === MARKUP_ORDERED_LIST_TYPE,
  );

  const tag = computed(() => (isOrdered.value ? 'ol' : 'ul'));

  const listClass = computed(() => {
    const baseClass = isOrdered.value ? 'list-decimal' : 'list-disc';

    // my-2 — вертикальный отступ, чтобы список отбивался от соседних абзацев.
    return ['my-2 list-outside pl-6', baseClass];
  });

  const listItemBatches = computed(() => {
    const batches: VNode[][] = [];
    const content = node.content ?? [];

    for (const item of content) {
      if (Array.isArray(item)) {
        batches.push(renderNodes(item));

        continue;
      }

      // Вложенный список
      if (isMarkerNode(item) && item.type === MARKUP_LIST_TYPE) {
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
      v-for="(batch, index) in listItemBatches"
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
