<script setup lang="ts">
  import { SectionLink } from '~section/list';
  import { SectionPage } from '~section/page';

  import {
    bookLinkSchema,
    BOOKS_SECTION,
    getBookGroup,
    getEntryUrl,
  } from '../model';
</script>

<template>
  <!-- У источников нет фильтра, как и в старом SPA: только поиск. -->
  <SectionPage
    :section-key="BOOKS_SECTION.key"
    :title="BOOKS_SECTION.title"
    :list-url="BOOKS_SECTION.listUrl"
    :order="BOOKS_SECTION.order"
    :schema="bookLinkSchema"
    :get-key="getEntryUrl"
    :get-group="getBookGroup"
    :get-path="getEntryUrl"
  >
    <template #item="{ item, to }">
      <SectionLink
        :to="to"
        :title="item.name.rus"
        :subtitle="item.name.eng"
      />
    </template>
  </SectionPage>
</template>
