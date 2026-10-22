<script setup lang="ts">
  import type { SectionConfig } from '~section/model';

  import { SectionEntryModal } from '~section/entry-modal';
  import { SectionLink } from '~section/list';
  import { getEntryUrl, getFirstLetterGroup } from '~section/model';
  import { SectionTabList } from '~section/tab-list';

  import { optionDetailSchema, optionLinkSchema } from '../model';
  import OptionBody from '../options/OptionBody.vue';

  /**
   * Вкладка особенностей класса (воззвания, манёвры…): список с фильтром
   * класса, а особенность открывается в окне поверх страницы.
   */
  const { section } = defineProps<{
    section: SectionConfig;
  }>();

  const openPath = ref<string>();

  /**
   * Открывает особенность в окне.
   * @param url - адрес особенности
   */
  function open(url: string) {
    openPath.value = url;
  }
</script>

<template>
  <SectionTabList
    :section="section"
    :schema="optionLinkSchema"
    :get-key="getEntryUrl"
    :get-group="getFirstLetterGroup"
  >
    <template #item="{ item }">
      <button
        type="button"
        class="block w-full cursor-pointer rounded-md text-left transition-colors hover:bg-elevated"
        @click.left.exact.prevent="open(item.url)"
      >
        <SectionLink
          :title="item.name.rus"
          :subtitle="item.name.eng"
          :source="item.source"
        />
      </button>
    </template>
  </SectionTabList>

  <SectionEntryModal
    v-model:path="openPath"
    :schema="optionDetailSchema"
  >
    <template #default="{ entry }">
      <OptionBody :option="entry" />
    </template>
  </SectionEntryModal>
</template>
