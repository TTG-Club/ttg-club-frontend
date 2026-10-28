<script setup lang="ts">
  import { SectionLink } from '~section/list';
  import { getFirstLetterGroup } from '~section/model';
  import { SectionPage } from '~section/page';

  import {
    getTreasureKey,
    getTreasurePrice,
    TREASURES_SECTION,
    treasureSchema,
  } from '../model';
</script>

<template>
  <!--
    У драгоценностей нет своих страниц: строка только показывает название
    и цену.
  -->
  <SectionPage
    :section="TREASURES_SECTION"
    :schema="treasureSchema"
    :get-key="getTreasureKey"
    :get-group="getFirstLetterGroup"
  >
    <template #item="{ item }">
      <SectionLink
        :title="item.name.rus"
        :source="item.source"
      >
        <template #details>
          <span class="ml-auto shrink-0 text-highlighted">
            {{ getTreasurePrice(item) }}
          </span>
        </template>
      </SectionLink>
    </template>
  </SectionPage>
</template>
