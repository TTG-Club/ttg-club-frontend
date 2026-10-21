<script setup lang="ts">
  import { SectionLink } from '~section/list';
  import { SectionPage } from '~section/page';

  import {
    getEntryUrl,
    getGodGroup,
    godLinkSchema,
    GODS_SECTION,
  } from '../model';
</script>

<template>
  <!--
    Боги сгруппированы по мировоззрению. Слева у строки — сокращение
    мировоззрения, полное название в подсказке.
  -->
  <SectionPage
    :section-key="GODS_SECTION.key"
    :title="GODS_SECTION.title"
    :list-url="GODS_SECTION.listUrl"
    :filter-url="GODS_SECTION.filterUrl"
    :order="GODS_SECTION.order"
    :schema="godLinkSchema"
    :get-key="getEntryUrl"
    :get-group="getGodGroup"
    :get-path="getEntryUrl"
  >
    <template #item="{ item, to }">
      <SectionLink
        :to="to"
        :title="item.name.rus"
        :subtitle="item.name.eng"
      >
        <template #leading>
          <UTooltip :text="item.alignment">
            <span
              class="flex size-10 shrink-0 items-center justify-center border-r border-default text-lg text-default"
            >
              {{ item.shortAlignment }}
            </span>
          </UTooltip>
        </template>
      </SectionLink>
    </template>
  </SectionPage>
</template>
