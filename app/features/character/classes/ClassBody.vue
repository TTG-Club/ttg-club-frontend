<script setup lang="ts">
  import type { ClassDetail } from '../model';

  import { ContentRender } from '~content/render';
  import { SectionImageViewer } from '~section/image-preview';
  import { SectionSourceBar } from '~section/source-bar';

  import {
    CLASS_ICON,
    CLASS_TAB_TYPE,
    CLASS_TEXT,
    getClassDescription,
    getClassTabs,
    getClassTabSection,
  } from '../model';
  import ArchetypeSpells from './ArchetypeSpells.vue';
  import ClassOptionsTab from './ClassOptionsTab.vue';
  import ClassSpellsTab from './ClassSpellsTab.vue';
  import ClassTraitsTab from './ClassTraitsTab.vue';

  /**
   * Страница класса или архетипа по вкладкам: умения, описание, списки
   * заклинаний и особенностей. Галерея открывается во весь экран.
   */
  const { entry } = defineProps<{
    entry: ClassDetail;
  }>();

  const tabs = computed(() => getClassTabs(entry));

  const tabItems = computed(() =>
    tabs.value.map((tab) => ({ label: tab.name, value: tab.key })),
  );

  /** Страница открывается с первой вкладки. */
  function getFirstTabKey() {
    return tabs.value[0]?.key ?? '';
  }

  const activeKey = ref<string | number>(getFirstTabKey());

  const activeTab = computed(() =>
    tabs.value.find((tab) => tab.key === activeKey.value),
  );

  const listSection = computed(() =>
    activeTab.value ? getClassTabSection(activeTab.value) : undefined,
  );

  const description = computed(() => getClassDescription(entry));

  const spellTable = computed(() =>
    entry.archetypeSpellTable?.levels.length
      ? entry.archetypeSpellTable
      : undefined,
  );

  const images = computed(() => entry.images ?? []);

  const isGalleryOpen = ref(false);

  function openGallery() {
    isGalleryOpen.value = true;
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <SectionSourceBar :source="entry.source" />

    <div class="flex flex-wrap items-center gap-2">
      <UTabs
        v-model="activeKey"
        :items="tabItems"
        :content="false"
        :ui="{ list: 'w-auto flex-wrap', trigger: 'flex-none' }"
      />

      <UButton
        v-if="images.length"
        :icon="CLASS_ICON.gallery"
        :label="CLASS_TEXT.gallery"
        color="neutral"
        variant="subtle"
        @click.left.exact.prevent="openGallery"
      />
    </div>

    <ClassTraitsTab
      v-if="activeTab?.type === CLASS_TAB_TYPE.traits && entry.traits"
      :entry="entry"
      :traits="entry.traits"
    />

    <div
      v-else-if="activeTab?.type === CLASS_TAB_TYPE.description"
      class="content-render"
    >
      <ContentRender
        v-if="description"
        :html="description"
      />

      <ArchetypeSpells
        v-if="spellTable"
        :table="spellTable"
      />
    </div>

    <Suspense v-else-if="listSection && activeTab">
      <ClassSpellsTab
        v-if="activeTab.type === CLASS_TAB_TYPE.spells"
        :key="activeTab.key"
        :section="listSection"
      />

      <ClassOptionsTab
        v-else
        :key="activeTab.key"
        :section="listSection"
      />

      <template #fallback>
        <div class="flex flex-col gap-2">
          <USkeleton
            v-for="index in 8"
            :key="index"
            class="h-12 w-full"
          />
        </div>
      </template>
    </Suspense>

    <SectionImageViewer
      v-if="images.length"
      v-model:open="isGalleryOpen"
      :images="images"
      :alt="entry.name.rus"
    />
  </div>
</template>
