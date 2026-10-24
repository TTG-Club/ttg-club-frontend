<script setup lang="ts">
  import type { RuleDetail } from '../model';

  import { ContentRender } from '~content/render';
  import { SectionEntry } from '~section/entry';
  import { getWorkshopEditPath } from '~section/model';
  import { SectionSourceBar } from '~section/source-bar';

  import {
    RULE_CATEGORY_LABEL,
    ruleDetailSchema,
    RULES_SECTION,
  } from '../model';

  /**
   * Подпись категории правила в плашке.
   * @param rule - правило
   */
  function getCategory(rule: RuleDetail): string | undefined {
    return rule.type ? `${RULE_CATEGORY_LABEL} ${rule.type}` : undefined;
  }

  /**
   * Запись поверх списка раздела; без адреса — страница записи по адресу
   * страницы.
   */
  const { path = undefined } = defineProps<{
    path?: string;
  }>();
</script>

<template>
  <SectionEntry
    :path="path"
    :section="RULES_SECTION"
    :schema="ruleDetailSchema"
    :get-edit-path="getWorkshopEditPath"
  >
    <template #default="{ entry }">
      <SectionSourceBar :left="getCategory(entry)" />

      <ContentRender
        v-if="entry.description"
        :html="entry.description"
      />
    </template>
  </SectionEntry>
</template>
