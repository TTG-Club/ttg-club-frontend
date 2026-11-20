<script setup lang="ts">
  import type { NodeViewProps } from '@tiptap/vue-3';

  import { NodeViewWrapper } from '@tiptap/vue-3';

  import { buildMarkerChip } from './render-chip';

  const { node } = defineProps<NodeViewProps>();

  const raw = computed(() => String(node.attrs.raw ?? ''));

  // Разбираем raw ОДИН раз: чип + флаг блочности.
  const marker = computed(() => buildMarkerChip(raw.value));

  const chip = computed(() => marker.value.chip);

  // Блочные маркеры (заголовок/список/цитата/…) показываем блоком, чтобы они
  // выглядели как на странице; инлайновые — компактным чипом с фоном.
  const wrapperClass = computed(() =>
    marker.value.isBlock
      ? 'ttg-marker-chip-block block rounded-sm *:my-0! hover:bg-elevated/30'
      : 'ttg-marker-chip rounded-sm bg-elevated/40 px-0.5',
  );
</script>

<template>
  <NodeViewWrapper
    as="span"
    :class="wrapperClass"
    :title="raw"
  >
    <component :is="chip" />
  </NodeViewWrapper>
</template>
