<script setup lang="ts">
  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  import { useDiceRoll } from '~dice-roller/composables';

  import { getNodeText } from '../utils';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  const { roll } = useDiceRoll();

  // Формула броска = контент маркера (напр. «1к20+5»). Атрибут `notation`
  // оставлен для ОБРАТНОЙ совместимости со старым форматом
  // `{@dice текст | notation:формула}` (там формула жила в атрибуте).
  const rollFormula = computed(() => {
    const content = node.content ? getNodeText(node.content) : '';
    const notation = node.attrs?.notation;
    const raw = notation == null ? '' : String(notation);

    return raw.trim() ? raw : content;
  });

  // Показанный текст: атрибут `text` (напр. «+5»), если задан. Иначе показываем
  // сам контент (формулу) — как у простого `{@dice 2к6}`.
  const displayText = computed(() => {
    const text = node.attrs?.text;
    const raw = text == null ? '' : String(text);

    return raw.trim() ? raw : '';
  });

  /** Обрабатывает клик по роллеру: катит формулу (контент/`notation`). */
  function handleRoll() {
    const formula = rollFormula.value;

    if (!formula.trim()) {
      return;
    }

    roll({ formula });
  }

  const children = computed(() =>
    node.content ? renderNodes(node.content) : [],
  );
</script>

<template>
  <span
    class="cursor-pointer whitespace-nowrap text-link underline decoration-dotted underline-offset-2 hover:text-link hover:decoration-solid"
    @click.left.exact.prevent="handleRoll"
  >
    <template v-if="displayText">{{ displayText }}</template>

    <template v-else>
      <component
        :is="vnode"
        v-for="(vnode, index) in children"
        :key="index"
      />
    </template>
  </span>
</template>
