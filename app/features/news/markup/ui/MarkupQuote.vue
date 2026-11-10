<script setup lang="ts">
  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  import {
    MARKUP_COLORS,
    MARKUP_DEFAULT_COLOR,
    MARKUP_DEFAULT_VARIANT,
    MARKUP_QUOTE_CLASSES,
    MARKUP_VARIANTS,
  } from '../consts';
  import { pickMarkupOption } from '../utils';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  // Узел читаем внутри computed: ключи в MarkupRender порядковые, и компонент
  // может достаться другому узлу
  const color = computed(() =>
    pickMarkupOption(node.attrs?.color, MARKUP_COLORS, MARKUP_DEFAULT_COLOR),
  );

  const variant = computed(() =>
    pickMarkupOption(
      node.attrs?.variant,
      MARKUP_VARIANTS,
      MARKUP_DEFAULT_VARIANT,
    ),
  );

  const quoteClass = computed(() => MARKUP_QUOTE_CLASSES[color.value]);

  const children = computed(() =>
    node.content ? renderNodes(node.content) : [],
  );
</script>

<template>
  <UCard
    :variant="variant"
    class="my-2 border-l-4"
    :ui="{ root: quoteClass, body: 'sm:p-4' }"
  >
    <component
      :is="vnode"
      v-for="(vnode, index) in children"
      :key="index"
    />
  </UCard>
</template>
