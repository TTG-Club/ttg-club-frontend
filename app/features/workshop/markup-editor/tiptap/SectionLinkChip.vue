<script setup lang="ts">
  import type { NodeViewProps } from '@tiptap/vue-3';

  import { NodeViewContent, NodeViewWrapper } from '@tiptap/vue-3';

  import { isSectionKind } from './link-markers';
  import { SECTION_ICONS } from './render-chip';

  const { node } = defineProps<NodeViewProps>();

  const kind = computed(() => String(node.attrs.kind ?? 'link'));
  const url = computed(() => String(node.attrs.url ?? ''));

  // Ссылка на раздел — иконка раздела + цвет primary (как чип на странице);
  // обычная {@link} — нейтральная ссылка без иконки.
  const isSection = computed(() => isSectionKind(kind.value));
  const icon = computed(() => SECTION_ICONS.get(kind.value));

  const wrapperClass = computed(() =>
    isSection.value
      ? 'ttg-section-link-chip inline-flex items-center gap-0.5 rounded-sm bg-elevated/40 px-0.5 align-middle text-primary underline decoration-primary/40 underline-offset-2'
      : 'ttg-section-link-chip rounded-sm bg-elevated/40 px-0.5 text-link underline underline-offset-2',
  );
</script>

<template>
  <NodeViewWrapper
    as="span"
    :class="wrapperClass"
    :title="url"
  >
    <UIcon
      v-if="isSection && icon"
      :name="icon"
      class="size-3.5 shrink-0"
      contenteditable="false"
    />

    <NodeViewContent as="span" />
  </NodeViewWrapper>
</template>
