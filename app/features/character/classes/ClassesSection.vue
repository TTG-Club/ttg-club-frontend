<script setup lang="ts">
  import type { ClassLink } from '../model';

  import { getEntryUrl } from '~section/model';
  import { SectionPage } from '~section/page';

  import {
    CHARACTER_LIST_SECTION_VIEW,
    CLASSES_SECTION,
    classLinkSchema,
    expandClassSearch,
    getGroupName,
    sortByGroup,
  } from '../model';
  import ClassCard from './ClassCard.vue';
  import ClassEntry from './ClassEntry.vue';
  import ClassRowCard from './ClassRowCard.vue';

  const { isModern } = useCharacterListView();

  const listView = computed(() =>
    isModern.value
      ? CHARACTER_LIST_SECTION_VIEW.modern
      : CHARACTER_LIST_SECTION_VIEW.covers,
  );

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
  <!--
    Классы карточками: сначала основные, затем напарники, UA и хомбрю. Вид
    «Модерн» — строками, как в старом SPA, иначе обложками.
  -->
  <SectionPage
    :section="CLASSES_SECTION"
    :schema="classLinkSchema"
    :get-key="getEntryUrl"
    :get-group="getGroupName"
    :get-path="getEntryUrl"
    :sort-items="sortItems"
    :view="listView"
  >
    <template #item="{ item, to }">
      <ClassRowCard
        v-if="isModern"
        :class-link="item"
        :to="to"
      />

      <ClassCard
        v-else
        :class-link="item"
        :to="to"
      />
    </template>

    <template #entry="{ path }">
      <ClassEntry :path="path" />
    </template>
  </SectionPage>
</template>
