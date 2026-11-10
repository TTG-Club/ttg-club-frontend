<script setup lang="ts">
  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  import { toNewSiteUrl } from '../utils';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  const { newSiteUrl } = useRuntimeConfig().public;

  /**
   * Текст пишут на новом сайте, поэтому относительные ссылки ведут на его
   * страницы. Здесь такие же пути заняты разделами редакции 2014 года, и без
   * подмены ссылка открыла бы не ту запись.
   */
  const url = computed(() =>
    toNewSiteUrl(node.attrs?.url?.toString() ?? '', newSiteUrl),
  );

  const children = computed(() =>
    node.content ? renderNodes(node.content) : [],
  );
</script>

<template>
  <!-- Пустой url — не роняем рендер: показываем содержимое обычным текстом. -->
  <ULink
    v-if="url"
    :to="url"
    external
    target="_blank"
    rel="noopener noreferrer"
  >
    <component
      :is="vnode"
      v-for="(vnode, index) in children"
      :key="index"
    />
  </ULink>

  <span v-else>
    <component
      :is="vnode"
      v-for="(vnode, index) in children"
      :key="index"
    />
  </span>
</template>
