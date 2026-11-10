<script setup lang="ts">
  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  import { computed } from 'vue';

  import { getHeadingAnchor } from '../anchors';
  import { clampHeadingLevel } from '../utils';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  // Пользовательский уровень 1-4 (клампим, а не бросаем: MarkupHeading рендерится
  // ВНЕ try/catch MarkupRender, и throw из-за одного плохого `level:` уронил бы всю
  // страницу/предпросмотр). Маппинг пользовательский 1-4 → реальный тег h3-h6.
  const HEADING_TAGS = { 1: 'h3', 2: 'h4', 3: 'h5', 4: 'h6' } as const;

  const userLevel = clampHeadingLevel(node.attrs?.level);
  const tag = HEADING_TAGS[userLevel];

  // Якорь для содержания статьи (см. withHeadingAnchors). Отступ прокрутки
  // оставляет над заголовком воздух, когда к нему прокручивают по клику.
  const anchorId = computed(() => getHeadingAnchor(node));

  // Выравнивание заголовка (`left` — по умолчанию, класс не нужен).
  const alignClass = computed(() => {
    const align = node.attrs?.align;

    if (align === 'center') {
      return 'text-center';
    }

    if (align === 'right') {
      return 'text-right';
    }

    return '';
  });

  // Стили для каждого уровня
  const headingClasses = computed(() => {
    const baseClasses = `font-semibold text-default tracking-tight ${alignClass.value}`;

    switch (userLevel) {
      case 1: // h3 - главный в контенте
        return `${baseClasses} text-xl mt-6 mb-3 border-b border-default pb-2`;
      case 2: // h4 - подраздел
        return `${baseClasses} text-lg mt-5 mb-2`;
      case 3: // h5 - мелкий раздел
        return `${baseClasses} text-base mt-4 mb-2`;
      case 4: // h6 - минимальный
        return `${baseClasses} text-sm mt-3 mb-1 uppercase tracking-wide`;
      default:
        return baseClasses;
    }
  });

  const children = computed(() =>
    node.content ? renderNodes(node.content) : [],
  );
</script>

<template>
  <component
    :is="tag"
    :id="anchorId"
    :class="[headingClasses, 'scroll-mt-4']"
  >
    <component
      :is="vnode"
      v-for="(vnode, index) in children"
      :key="index"
    />
  </component>
</template>
