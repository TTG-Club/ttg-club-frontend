<script setup lang="ts">
  import type { SectionConfig } from '~section/model';

  import { SectionEntryModal } from '~section/entry-modal';
  import { SectionLink } from '~section/list';
  import { getEntryUrl } from '~section/model';
  import { SectionTabList } from '~section/tab-list';

  import { getSpellGroup, spellDetailSchema, spellLinkSchema } from '../model';
  import SpellBody from '../spells/SpellBody.vue';
  import SpellLevel from '../spells/SpellLevel.vue';
  import SpellLinkDetails from '../spells/SpellLinkDetails.vue';

  /**
   * Вкладка «Заклинания» класса: список с фильтром класса, а заклинание
   * открывается в окне, не уводя со страницы класса.
   */
  const { section } = defineProps<{
    section: SectionConfig;
  }>();

  const openPath = ref<string>();

  /**
   * Открывает заклинание в окне.
   * @param url - адрес заклинания
   */
  function open(url: string) {
    openPath.value = url;
  }
</script>

<template>
  <SectionTabList
    :section="section"
    :schema="spellLinkSchema"
    :get-key="getEntryUrl"
    :get-group="getSpellGroup"
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
        >
          <template #leading>
            <SpellLevel :level="item.level" />
          </template>

          <template #details>
            <SpellLinkDetails :spell="item" />
          </template>
        </SectionLink>
      </button>
    </template>
  </SectionTabList>

  <SectionEntryModal
    v-model:path="openPath"
    :schema="spellDetailSchema"
  >
    <template #default="{ entry }">
      <SpellBody :spell="entry" />
    </template>
  </SectionEntryModal>
</template>
