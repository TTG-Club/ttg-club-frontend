<script setup lang="ts">
  import { SectionLink } from '~section/list';
  import { getEntryUrl } from '~section/model';
  import { SectionPage } from '~section/page';

  import { getGodGroup, godLinkSchema, GODS_SECTION } from '../model';
  import GodEntry from './GodEntry.vue';
</script>

<template>
  <!--
    Боги сгруппированы по мировоззрению. Слева у строки — сокращение
    мировоззрения, полное название в подсказке.
  -->
  <SectionPage
    :section="GODS_SECTION"
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

    <template #entry="{ path }">
      <GodEntry :path="path" />
    </template>
  </SectionPage>
</template>
