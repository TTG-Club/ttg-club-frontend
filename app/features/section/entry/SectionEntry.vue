<script
  setup
  lang="ts"
  generic="
    T extends {
      id?: number | null;
      name: EntryName;
      source?: EntrySource | null;
    }
  "
>
  import type { DropdownMenuItem } from '@nuxt/ui';
  import type { z } from 'zod';

  import type { ComponentPublicInstance } from 'vue';

  import type { EntryName, EntrySource, SectionConfig } from '../model';

  import { BookmarkButton } from '~bookmarks/button';
  import { CommentsBlock } from '~comments/section';

  import {
    useEntryExport,
    useSectionEntry,
    useSectionOpener,
    useSectionSwipe,
  } from '../composables';
  import { SectionDetailPane } from '../detail-pane';
  import { ENTRY_EXPORT_LABELS, SECTION_ICON } from '../model';

  /**
   * Запись раздела: загрузка, заголовок, закладка, ссылка на правку,
   * закрытие и комментарии. Без `path` это страница записи по адресу, с `path` — запись
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

  const { exportEntry } = useEntryExport();

  // Экспорт есть только у разделов, которые его объявили, и только у записей
  // с идентификатором: по нему ручка находит запись
  const exportItems = computed<Array<DropdownMenuItem>>(() => {
    const sectionExport = section.export;
    const exportedId = entry.value?.id;
    const exportedName = entry.value?.name;

    if (!sectionExport || !exportedId || !exportedName) {
      return [];
    }

    return sectionExport.platforms.map((platform) => ({
      label: ENTRY_EXPORT_LABELS[platform],
      icon: SECTION_ICON.export,
      onSelect: () =>
        exportEntry(platform, sectionExport.type, {
          id: exportedId,
          name: exportedName.eng || exportedName.rus,
        }),
    }));
  });

  const pane = useTemplateRef<ComponentPublicInstance>('pane');

  // Свайпом листается только страница записи: поверх списка жест занят
  // дровером
  const { style: swipeStyle } = useSectionSwipe(
    section.key,
    () => (isEmbedded ? undefined : unrefElement(pane)),
    entryPath,
  );

  function close(): void {
    opener?.close();
  }
</script>

<template>
  <SectionDetailPane
    ref="pane"
    :class="wrapperClass"
    :style="swipeStyle"
    :title="entry?.name.rus ?? ''"
    :subtitle="entry?.name.eng"
    :source="entry?.source"
    :path="path"
    :close-to="closeTo"
    :edit-url="editUrl"
    :is-loading="isLoading"
    :is-error="isError"
    :menu-items="exportItems"
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

    <template v-if="entry">
      <slot :entry="entry" />

      <!-- Блок сам решает, есть ли у раздела обсуждение -->
      <CommentsBlock
        :path="entryPath"
        class="print:hidden"
      />
    </template>
  </SectionDetailPane>
</template>
