<script setup lang="ts">
  import type { RuleDetail } from '../model';

  import { hasContentDescription } from '~content/model';
  import { ContentRender } from '~content/render';
  import { SectionSourceBar } from '~section/source-bar';

  import { RULE_CATEGORY_LABEL } from '../model';

  /** Карточка правила: категория в плашке и текст. */
  const { rule } = defineProps<{
    rule: RuleDetail;
  }>();

  const category = computed(() =>
    rule.type ? `${RULE_CATEGORY_LABEL} ${rule.type}` : undefined,
  );
</script>

<template>
  <SectionSourceBar :left="category" />

  <ContentRender
    v-if="hasContentDescription(rule.description)"
    :content="rule.description"
  />
</template>
