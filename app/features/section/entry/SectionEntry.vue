<script setup lang="ts" generic="T extends { name: EntryName }">
  import type { z } from 'zod';

  import type { EntryName, SectionConfig } from '../model';

  import { BookmarkButton } from '~bookmarks/button';

  import { useSectionEntry, useSectionOpener } from '../composables';
  import { SectionDetailPane } from '../detail-pane';

  /**
   * Запись раздела: загрузка, заголовок, закладка, ссылка на правку и
   * закрытие. Без `path` это страница записи по адресу, с `path` — запись
   * поверх списка раздела (панель рядом или дровер), её закрывает страница
   * раздела. Раздел задаёт только схему и карточку записи.
   */
  const {
    section,
    schema,
    path = undefined,
    getEditPath = undefined,
  } = defineProps<{
    section: SectionConfig;
    schema: z.ZodType<T>;
    /** Адрес записи, открытой поверх списка, например `/spells/fireball`. */
    path?: string;
    /** Страница правки в мастерской; без неё правки у записей нет. */
    getEditPath?: (path: string) => string;
  }>();

  defineSlots<{
    default: (props: { entry: T }) => unknown;
  }>();

  const route = useRoute();
  const opener = useSectionOpener();

  const entryPath = computed(() => path ?? route.path);

  // Запись не переходит между страницей и списком, поэтому режим постоянный
  const isEmbedded = path !== undefined;

  const { entry, isLoading, isError } = await useSectionEntry({
    key: section.key,
    path: entryPath,
    schema,
    isEmbedded,
  });

  // Со страницы записи закрытие ведёт в раздел
  const closeTo = computed(() =>
    isEmbedded ? undefined : { path: section.path },
  );

  const editUrl = computed(() => getEditPath?.(entryPath.value));

  const wrapperClass = computed(() =>
    isEmbedded ? undefined : 'mx-auto w-full max-w-4xl',
  );

  function close(): void {
    opener?.close();
  }
</script>

<template>
  <SectionDetailPane
    :class="wrapperClass"
    :title="entry?.name.rus ?? ''"
    :subtitle="entry?.name.eng"
    :path="path"
    :close-to="closeTo"
    :edit-url="editUrl"
    :is-loading="isLoading"
    :is-error="isError"
    @close="close"
  >
    <template #actions>
      <ClientOnly>
        <BookmarkButton
          v-if="entry"
          :url="entryPath"
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
