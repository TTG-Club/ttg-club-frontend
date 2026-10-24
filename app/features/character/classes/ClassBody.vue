<script setup lang="ts">
  import type { ClassDetail } from '../model';

  import { ContentRender } from '~content/render';
  import { SectionDetailLayout } from '~section/detail-layout';
  import { SectionDrawer } from '~section/entry-drawer';
  import { SectionImageCover } from '~section/image-preview';

  import { CLASS_ICON, CLASS_TEXT, getClassDescription } from '../model';
  import ArchetypeSpells from './ArchetypeSpells.vue';
  import ClassRoutingBar from './ClassRoutingBar.vue';
  import ClassTraitsTab from './ClassTraitsTab.vue';

  /**
   * Страница класса или архетипа, как на new.ttg.club: слева обложка с
   * галереей, справа умения. Над ними переходы к классу, подклассам,
   * заклинаниям и особенностям, а описание открывается в дровере.
   */
  const { entry, path } = defineProps<{
    entry: ClassDetail;
    /** Адрес открытой записи: класса или архетипа. */
    path: string;
  }>();

  const description = computed(() => getClassDescription(entry));

  const spellTable = computed(() =>
    entry.archetypeSpellTable?.levels.length
      ? entry.archetypeSpellTable
      : undefined,
  );

  const images = computed(() => entry.images ?? []);

  const isDescriptionOpen = ref(false);

  function openDescription() {
    isDescriptionOpen.value = true;
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <ClassRoutingBar
      :entry="entry"
      :path="path"
    >
      <UButton
        v-if="description || spellTable"
        :icon="CLASS_ICON.description"
        variant="soft"
        color="neutral"
        @click.left.exact.prevent="openDescription"
      >
        <span class="flex flex-col items-start leading-tight">
          <span class="text-xs text-muted">{{ CLASS_TEXT.aboutLabel }}</span>

          <span>{{ CLASS_TEXT.description }}</span>
        </span>
      </UButton>
    </ClassRoutingBar>

    <SectionDetailLayout>
      <template
        v-if="images.length"
        #aside
      >
        <SectionImageCover
          :images="images"
          :alt="entry.name.rus"
        />
      </template>

      <ClassTraitsTab
        v-if="entry.traits"
        :entry="entry"
        :traits="entry.traits"
      />
    </SectionDetailLayout>

    <SectionDrawer
      v-model:open="isDescriptionOpen"
      :title="CLASS_TEXT.description"
      :subtitle="entry.name.rus"
    >
      <div class="content-render">
        <ContentRender
          v-if="description"
          :html="description"
        />

        <ArchetypeSpells
          v-if="spellTable"
          :table="spellTable"
        />
      </div>
    </SectionDrawer>
  </div>
</template>
