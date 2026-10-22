<script setup lang="ts">
  import { SectionLink } from '~section/list';
  import { getEntryUrl } from '~section/model';
  import { SectionPage } from '~section/page';

  import { bookLinkSchema, BOOKS_SECTION, getBookGroup } from '../model';
  import BookEntry from './BookEntry.vue';
</script>

<template>
  <!-- У источников нет фильтра, как и в старом SPA: только поиск. -->
  <SectionPage
    :section="BOOKS_SECTION"
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

    <template #entry="{ path }">
      <BookEntry :path="path" />
    </template>
  </SectionPage>
</template>
