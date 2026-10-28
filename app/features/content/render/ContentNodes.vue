<script setup lang="ts">
  import type { ContentNode } from '../model';

  import { DiceRoller } from '~dice-roller/roller';

  import { DetailTooltip } from '../detail-tooltip';
  import { toRenderItem } from '../model';
  import ContentLink from './ContentLink.vue';

  /** Рекурсивный вывод узлов очищенного HTML-контента. */
  const { nodes } = defineProps<{
    nodes: Array<ContentNode>;
  }>();

  const items = computed(() => nodes.map(toRenderItem));
</script>

<template>
  <template
    v-for="(item, index) in items"
    :key="index"
  >
    <template v-if="item.kind === 'text'">
      {{ item.text }}
    </template>

    <DiceRoller
      v-else-if="item.kind === 'dice'"
      v-bind="item.props"
    >
      <ContentNodes
        v-if="item.children.length"
        :nodes="item.children"
      />
    </DiceRoller>

    <DetailTooltip
      v-else-if="item.kind === 'tooltip'"
      v-bind="item.props"
    >
      <ContentNodes :nodes="item.children" />
    </DetailTooltip>

    <ContentLink
      v-else-if="item.kind === 'link'"
      :href="item.href"
      :attributes="item.attributes"
    >
      <ContentNodes :nodes="item.children" />
    </ContentLink>

    <component
      :is="item.tag"
      v-else-if="item.kind === 'void'"
      v-bind="item.attributes"
    />

    <ContentNodes
      v-else-if="item.kind === 'fragment'"
      :nodes="item.children"
    />

    <component
      :is="item.tag"
      v-else
      v-bind="item.attributes"
    >
      <ContentNodes :nodes="item.children" />
    </component>
  </template>
</template>
