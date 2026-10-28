<script setup lang="ts">
  import type { SvgNode } from '../model';

  /** Узел очищенной SVG-иконки; дочерние узлы выводятся рекурсивно. */
  const { node } = defineProps<{
    node: SvgNode;
  }>();
</script>

<template>
  <component
    :is="node.tag"
    v-bind="node.attributes"
  >
    <ScreenSvgNode
      v-for="(child, index) in node.children"
      :key="index"
      :node="child"
    />
  </component>
</template>
