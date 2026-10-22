<script setup lang="ts">
  import { getEntryUrl } from '~section/model';
  import { SectionPage } from '~section/page';

  import { screenLinkSchema, SCREENS_SECTION } from '../model';
  import ScreenCard from './ScreenCard.vue';
  import ScreenEntry from './ScreenEntry.vue';
</script>

<template>
  <!-- Корневые разделы ширмы карточками в сетку -->
  <SectionPage
    :section="SCREENS_SECTION"
    :schema="screenLinkSchema"
    :get-key="getEntryUrl"
    :get-path="getEntryUrl"
    is-grid
  >
    <template #item="{ item, to }">
      <ScreenCard
        :to="to"
        :title="item.name.rus"
        :subtitle="item.name.eng"
      />
    </template>

    <template #entry="{ path }">
      <ScreenEntry :path="path" />
    </template>
  </SectionPage>
</template>
