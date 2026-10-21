<script setup lang="ts">
  import { BookmarkButton } from '~bookmarks/button';
  import { ContentRender } from '~content/render';
  import { useSectionEntry } from '~section/composables';
  import { SectionDetailPane } from '~section/detail-pane';
  import { getWorkshopEditPath } from '~section/model';
  import { SectionSourceBar } from '~section/source-bar';

  import {
    RULE_CATEGORY_LABEL,
    ruleDetailSchema,
    RULES_SECTION,
  } from '../model';

  /** Открытое правило или термин рядом со списком. */
  const route = useRoute();

  const {
    entry: rule,
    isLoading,
    isError,
  } = await useSectionEntry({
    key: RULES_SECTION.key,
    path: () => route.path,
    schema: ruleDetailSchema,
  });

  const closeTo = computed(() => ({
    path: RULES_SECTION.path,
    query: route.query,
  }));

  const editUrl = computed(() => getWorkshopEditPath(route.path));

  const category = computed(() =>
    rule.value?.type ? `${RULE_CATEGORY_LABEL} ${rule.value.type}` : undefined,
  );
</script>

<template>
  <SectionDetailPane
    :title="rule?.name.rus ?? ''"
    :subtitle="rule?.name.eng"
    :close-to="closeTo"
    :edit-url="editUrl"
    :is-loading="isLoading"
    :is-error="isError"
  >
    <template #actions>
      <ClientOnly>
        <BookmarkButton
          v-if="rule"
          :url="route.path"
          :name="rule.name.rus"
        />
      </ClientOnly>
    </template>

    <template v-if="rule">
      <SectionSourceBar
        :left="category"
        :source="rule.source"
      />

      <ContentRender
        v-if="rule.description"
        :html="rule.description"
      />
    </template>
  </SectionDetailPane>
</template>
