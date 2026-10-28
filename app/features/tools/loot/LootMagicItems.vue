<script setup lang="ts">
  import type { LootGroup, LootMagicItem } from '../model';

  import { MagicItemBody } from '~inventory/magic-items';
  import { magicItemDetailSchema } from '~inventory/model';
  import { SectionEntryDrawer } from '~section/entry-drawer';

  import LootMagicItemTile from './LootMagicItemTile.vue';
  import LootSection from './LootSection.vue';
  import LootSpell from './LootSpell.vue';

  /**
   * Магические предметы добычи плитками; выбранный открывается дровером с
   * описанием и, у свитка, заклинанием.
   */
  const { title, groups } = defineProps<{
    title: string;
    groups: Array<LootGroup<LootMagicItem>>;
  }>();

  const selected = shallowRef<LootMagicItem>();

  const isOpen = ref(false);

  /**
   * Открывает предмет в дровере.
   * @param item - магический предмет
   */
  function select(item: LootMagicItem): void {
    selected.value = item;
    isOpen.value = true;
  }

  /**
   * Открыт ли предмет сейчас.
   * @param item - магический предмет
   */
  function isActive(item: LootMagicItem): boolean {
    return isOpen.value && selected.value === item;
  }
</script>

<template>
  <LootSection :title="title">
    <LootMagicItemTile
      v-for="(group, index) in groups"
      :key="`${group.item.url}-${index}`"
      :group="group"
      :is-active="isActive(group.item)"
      @select="select(group.item)"
    />
  </LootSection>

  <SectionEntryDrawer
    v-if="selected"
    :key="selected.url"
    v-model:open="isOpen"
    :schema="magicItemDetailSchema"
    :path="selected.url"
    :title="selected.name.rus"
  >
    <template #default="{ entry }">
      <MagicItemBody :item="entry" />

      <LootSpell
        v-if="selected.spell"
        :key="selected.spell.url"
        :spell="selected.spell"
      />
    </template>
  </SectionEntryDrawer>
</template>
