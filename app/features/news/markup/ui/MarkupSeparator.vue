<script setup lang="ts">
  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  import { MARKUP_COLORS, MARKUP_DEFAULT_COLOR } from '../consts';
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

  const hasContent = computed(() => Boolean(node.content?.length));

  const children = computed(() =>
    node.content ? renderNodes(node.content) : [],
  );
</script>

<template>
  <!--
    Обёртка задаёт весь воздух вокруг линии паддингом, а не margin: margin'ы
    соседей MarkupRender гасит, и зазор сверху и снизу выходит одинаковым.
  -->
  <div class="py-6">
    <USeparator
      v-if="hasContent"
      :color="color"
    >
      <component
        :is="vnode"
        v-for="(vnode, index) in children"
        :key="index"
      />
    </USeparator>

    <USeparator
      v-else
      :color="color"
    />
  </div>
</template>
