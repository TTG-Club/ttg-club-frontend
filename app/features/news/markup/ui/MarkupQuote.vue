<script setup lang="ts">
  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  import { computed } from 'vue';

  import { UCard } from '#components';

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

  function validateVariant(
    variant: string | number | boolean | null | undefined,
  ): 'solid' | 'outline' | 'soft' | 'subtle' {
    if (variant === 'solid') {
      return 'solid';
    }

    if (variant === 'outline') {
      return 'outline';
    }

    if (variant === 'soft') {
      return 'soft';
    }

    if (variant === 'subtle') {
      return 'subtle';
    }

    return 'soft';
  }

  const color = validateColor(node.attrs?.color);
  const variant = validateVariant(node.attrs?.variant);

  const children = computed(() =>
    node.content ? renderNodes(node.content) : [],
  );

  const styles = computed(
    () => `text-${color} bg-${color}/10 border-${color} ring-${color}`,
  );
</script>

<template>
  <UCard
    :variant="variant"
    class="my-2 border-l-4"
    :ui="{ root: styles, body: 'sm:p-4' }"
  >
    <component
      :is="vnode"
      v-for="(vnode, index) in children"
      :key="index"
    />
  </UCard>
</template>
