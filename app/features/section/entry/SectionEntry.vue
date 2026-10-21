<script setup lang="ts" generic="T extends { name: EntryName }">
  import type { z } from 'zod';

  import type { EntryName, SectionConfig } from '../model';

  import { BookmarkButton } from '~bookmarks/button';

  import { useSectionEntry } from '../composables';
  import { SectionDetailPane } from '../detail-pane';

  /**
   * Открытая запись раздела рядом со списком: загрузка, заголовок,
   * закладка, ссылка на правку и закрытие. Раздел задаёт только схему и
   * карточку записи.
   */
  const {
    section,
    schema,
    getEditPath = undefined,
  } = defineProps<{
    section: SectionConfig;
    schema: z.ZodType<T>;
    /** Страница правки в мастерской; без неё правки у записей нет. */
    getEditPath?: (path: string) => string;
  }>();

  defineSlots<{
    default: (props: { entry: T }) => unknown;
  }>();

  const route = useRoute();

  const { entry, isLoading, isError } = await useSectionEntry({
    key: section.key,
    path: () => route.path,
    schema,
  });

  // Поиск и фильтр списка остаются после закрытия записи
  const closeTo = computed(() => ({ path: section.path, query: route.query }));

  const editUrl = computed(() => getEditPath?.(route.path));
</script>

<template>
  <SectionDetailPane
    :title="entry?.name.rus ?? ''"
    :subtitle="entry?.name.eng"
    :close-to="closeTo"
    :edit-url="editUrl"
    :is-loading="isLoading"
    :is-error="isError"
  >
    <template #actions>
      <ClientOnly>
        <BookmarkButton
          v-if="entry"
          :url="route.path"
          :name="entry.name.rus"
        />
      </ClientOnly>
    </template>

    <slot
      v-if="entry"
      :entry="entry"
    />
  </SectionDetailPane>
</template>
