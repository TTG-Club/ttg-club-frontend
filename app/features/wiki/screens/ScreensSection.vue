<script setup lang="ts">
  import { getEntryUrl } from '~section/model';
  import { SectionPage } from '~section/page';

  import {
    getScreenGroup,
    getScreenGroupOrder,
    screenLinkSchema,
    SCREENS_SECTION,
  } from '../model';
  import ScreenEntry from './ScreenEntry.vue';
  import ScreenLinkCard from './ScreenLinkCard.vue';
</script>

<template>
  <!--
    Вложенные разделы справочника плитками, сгруппированные по корневым
    разделам в их порядке; запись открывается как в остальных разделах.
  -->
  <SectionPage
    :section="SCREENS_SECTION"
    :schema="screenLinkSchema"
    :get-key="getEntryUrl"
    :get-group="getScreenGroup"
    :get-group-order="getScreenGroupOrder"
    :get-path="getEntryUrl"
  >
    <template #item="{ item }">
      <ScreenLinkCard :screen="item" />
    </template>

    <template #entry="{ path }">
      <ScreenEntry :path="path" />
    </template>
  </SectionPage>
</template>
