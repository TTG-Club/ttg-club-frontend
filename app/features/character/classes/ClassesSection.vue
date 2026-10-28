<script setup lang="ts">
  import type { ClassLink } from '../model';

  import { getEntryUrl } from '~section/model';
  import { SectionPage } from '~section/page';

  import {
    CLASSES_SECTION,
    classLinkSchema,
    expandClassSearch,
    getGroupName,
    sortByGroup,
  } from '../model';
  import ClassCard from './ClassCard.vue';
  import ClassEntry from './ClassEntry.vue';

  /**
   * Классы по группам, а при поиске найденные подклассы встают отдельными
   * карточками.
   * @param items - классы из ответа
   * @param search - строка поиска
   */
  function sortItems(items: Array<ClassLink>, search: string) {
    return expandClassSearch(sortByGroup(items), search);
  }
</script>

<template>
  <!-- Классы карточками: сначала основные, затем напарники, UA и хомбрю -->
  <SectionPage
    :section="CLASSES_SECTION"
    :schema="classLinkSchema"
    :get-key="getEntryUrl"
    :get-group="getGroupName"
    :get-path="getEntryUrl"
    :sort-items="sortItems"
    view="covers"
  >
    <template #item="{ item, to }">
      <ClassCard
        :class-link="item"
        :to="to"
      />
    </template>

    <template #entry="{ path }">
      <ClassEntry :path="path" />
    </template>
  </SectionPage>
</template>
