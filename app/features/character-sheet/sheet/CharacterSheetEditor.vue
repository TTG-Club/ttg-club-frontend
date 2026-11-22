<script setup lang="ts">
  import type { SheetTab } from '../model';

  import { useCharacterSheet, useSheetClassData } from '../composables';
  import {
    CHARACTER_SHEET_ROUTE,
    SHEET_ICON,
    SHEET_TABS,
    SHEET_TEXT,
  } from '../model';
  import SheetAbilities from './SheetAbilities.vue';
  import SheetCombatStats from './SheetCombatStats.vue';
  import SheetFeatures from './SheetFeatures.vue';
  import SheetHeader from './SheetHeader.vue';
  import SheetHealth from './SheetHealth.vue';
  import SheetInventory from './SheetInventory.vue';
  import SheetNotes from './SheetNotes.vue';
  import SheetPersonality from './SheetPersonality.vue';
  import SheetProficiencies from './SheetProficiencies.vue';
  import SheetSkills from './SheetSkills.vue';
  import SheetSpells from './SheetSpells.vue';

  /**
   * Лист персонажа целиком: загрузка по идентификатору, шапка, характеристики,
   * боевые показатели, хиты, навыки и вкладки снаряжения, заклинаний, умений,
   * личности и заметок. Правки сохраняются сами.
   */
  const { id } = defineProps<{
    id: string;
  }>();

  const { loadStatus, name, load } = useCharacterSheet();

  // Механика классов грузится вместе с листом и живёт, пока он открыт
  useSheetClassData();

  const activeTab = ref<SheetTab>('inventory');

  const tabItems = SHEET_TABS.map((tab) => ({ ...tab, slot: tab.value }));

  useSeoMeta({
    title: () => name.value || SHEET_TEXT.title,
  });

  watch(
    () => id,
    (next) => {
      if (next) {
        load(next);
      }
    },
    { immediate: true },
  );

  function retry(): void {
    load(id);
  }
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
    <div
      v-if="loadStatus === 'pending' || loadStatus === 'idle'"
      class="flex flex-col gap-4"
    >
      <USkeleton class="h-12 w-1/2 rounded-lg" />

      <USkeleton class="h-24 w-full rounded-xl" />

      <USkeleton class="h-64 w-full rounded-xl" />
    </div>

    <UEmpty
      v-else-if="loadStatus === 'notFound'"
      :icon="SHEET_ICON.empty"
      :title="SHEET_TEXT.notFound"
      :description="SHEET_TEXT.notFoundDescription"
      variant="naked"
      class="py-16"
    >
      <template #actions>
        <UButton
          :label="SHEET_TEXT.backToList"
          :to="CHARACTER_SHEET_ROUTE"
        />
      </template>
    </UEmpty>

    <UEmpty
      v-else-if="loadStatus === 'error'"
      :icon="SHEET_ICON.empty"
      :title="SHEET_TEXT.sheetLoadFailed"
      variant="naked"
      class="py-16"
    >
      <template #actions>
        <UButton
          :label="SHEET_TEXT.retry"
          @click.left.exact.prevent="retry"
        />
      </template>
    </UEmpty>

    <template v-else>
      <SheetHeader />

      <SheetAbilities />

      <SheetCombatStats />

      <div class="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div class="flex flex-col gap-4">
          <SheetHealth />

          <SheetSkills />

          <SheetProficiencies />
        </div>

        <UTabs
          v-model="activeTab"
          :items="tabItems"
          variant="link"
          :ui="{ list: 'overflow-x-auto', content: 'pt-3' }"
        >
          <template #inventory>
            <SheetInventory />
          </template>

          <template #spells>
            <SheetSpells />
          </template>

          <template #features>
            <SheetFeatures />
          </template>

          <template #personality>
            <SheetPersonality />
          </template>

          <template #notes>
            <SheetNotes />
          </template>
        </UTabs>
      </div>
    </template>
  </div>
</template>
