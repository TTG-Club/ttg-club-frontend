<script setup lang="ts">
  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  import { computed } from 'vue';

  import { USeparator } from '#components';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  function validateColor(
    color: string | number | boolean | null | undefined,
  ):
    | 'error'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'info'
    | 'warning'
    | 'neutral' {
    if (color === 'error') {
      return 'error';
    }

    if (color === 'primary') {
      return 'primary';
    }

    if (color === 'secondary') {
      return 'secondary';
    }

    if (color === 'success') {
      return 'success';
    }

    if (color === 'info') {
      return 'info';
    }

    if (color === 'warning') {
      return 'warning';
    }

    if (color === 'neutral') {
      return 'neutral';
    }

    return 'neutral';
  }

  const color = validateColor(node.attrs?.color);

  const hasContent = computed(() => node.content && node.content.length > 0);

  const children = computed(() =>
    node.content ? renderNodes(node.content) : [],
  );
</script>

<template>
  <!--
    Обёртка задаёт ВЕСЬ воздух вокруг линии — паддингом, а не margin. Так зазор
    сверху и снизу одинаков: margin'ы соседей MarkupRender гасит (во флекс-колонке
    тела статьи они не схлопываются, и `mt-*` заголовка после линии делал бы зазор
    снизу шире). В редакторе чип блочного маркера гасит margin потомков
    (`*:my-0!` в MarkerChip), а паддинг остаётся — линия отбита и там, и там.
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
