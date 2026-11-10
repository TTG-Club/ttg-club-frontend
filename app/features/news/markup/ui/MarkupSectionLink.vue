<script setup lang="ts">
  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  import { consola } from 'consola';

  import { SECTION_LINK_PLAIN_TEXT_WARNING } from '../consts';
  import { getSectionLinkPath, toNewSiteUrl } from '../utils';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  const { newSiteUrl } = useRuntimeConfig().public;

  /**
   * Ссылки на разделы в новостях ведут на записи редакции 2024 года — их
   * открываем на новом сайте в новой вкладке. Узел читаем внутри computed:
   * ключи в MarkupRender порядковые, и компонент может достаться другому узлу.
   */
  const to = computed(() => {
    const path = getSectionLinkPath(node);

    return path ? toNewSiteUrl(path, newSiteUrl) : '';
  });

  /**
   * Ссылка без адреса раздела рисуется обычным текстом. Бросать нельзя:
   * ошибка оборвала бы отрисовку всего текста, а не одной ссылки.
   */
  watch(
    to,
    (linkPath) => {
      if (!linkPath) {
        consola.warn(SECTION_LINK_PLAIN_TEXT_WARNING, JSON.stringify(node));
      }
    },
    { immediate: true },
  );

  const children = computed(() =>
    node.content ? renderNodes(node.content) : [],
  );
</script>

<template>
  <ULink
    v-if="to"
    :to="to"
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

  <template v-else>
    <component
      :is="vnode"
      v-for="(vnode, index) in children"
      :key="index"
    />
  </template>
</template>
