<script setup lang="ts">
  import { BookmarkButton } from '~bookmarks/button';
  import { useSectionEntry } from '~section/composables';
  import { SectionDetailPane } from '~section/detail-pane';
  import { getWorkshopEditPath } from '~section/model';

  import { godDetailSchema, GODS_SECTION } from '../model';
  import GodBody from './GodBody.vue';

  /** Открытый бог рядом со списком. */
  const route = useRoute();

  const {
    entry: god,
    isLoading,
    isError,
  } = await useSectionEntry({
    key: GODS_SECTION.key,
    path: () => route.path,
    schema: godDetailSchema,
  });

  const closeTo = computed(() => ({
    path: GODS_SECTION.path,
    query: route.query,
  }));

  const editUrl = computed(() => getWorkshopEditPath(route.path));
</script>

<template>
  <SectionDetailPane
    :title="god?.name.rus ?? ''"
    :subtitle="god?.name.eng"
    :close-to="closeTo"
    :edit-url="editUrl"
    :is-loading="isLoading"
    :is-error="isError"
  >
    <template #actions>
      <ClientOnly>
        <BookmarkButton
          v-if="god"
          :url="route.path"
          :name="god.name.rus"
        />
      </ClientOnly>
    </template>

    <GodBody
      v-if="god"
      :god="god"
    />
  </SectionDetailPane>
</template>
