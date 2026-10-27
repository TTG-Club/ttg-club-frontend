<script
  setup
  lang="ts"
  generic="T extends { name: EntryName; source?: EntrySource | null }"
>
  import type { EntryName, EntrySource } from '~section/model';

  import { SectionDrawer } from '~section/entry-drawer';

  import { WORKSHOP_TEXT } from '../model';

  /**
   * Предпросмотр записи в дровере справа: та же карточка, что в справочнике,
   * но собранная по данным формы. Кнопки перехода на страницу нет: записи
   * с такими данными ещё не существует.
   */
  const { entry, isLoading, isError } = defineProps<{
    entry: T | undefined;
    isLoading: boolean;
    isError: boolean;
  }>();

  const isOpen = defineModel<boolean>('open', { required: true });

  defineSlots<{
    default: (props: { entry: T }) => unknown;
  }>();

  const title = computed(() => entry?.name.rus ?? WORKSHOP_TEXT.preview);
</script>

<template>
  <SectionDrawer
    v-model:open="isOpen"
    :title="title"
    :subtitle="entry?.name.eng"
    :source="entry?.source"
    :is-loading="isLoading"
    :is-error="isError"
  >
    <slot
      v-if="entry"
      :entry="entry"
    />
  </SectionDrawer>
</template>
