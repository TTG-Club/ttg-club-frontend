<script
  setup
  lang="ts"
  generic="T extends { name: EntryName; source?: EntrySource | null }"
>
  import type { z } from 'zod';

  import type { EntryName, EntrySource } from '../model';

  import { getEntryApiPath } from '../model';
  import SectionDrawer from './SectionDrawer.vue';

  /**
   * Запись раздела в дровере поверх страницы: грузится, когда дровер
   * открывают, и выводится через слот карточкой своего раздела.
   */
  const {
    schema,
    path,
    title = '',
  } = defineProps<{
    schema: z.ZodType<T>;
    /** Адрес страницы записи, например `/spells/fireball`. */
    path: string;
    /** Заголовок, пока запись грузится: текст ссылки, по которой открыли. */
    title?: string;
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  defineSlots<{
    default: (props: { entry: T }) => unknown;
  }>();

  const {
    data: entry,
    status,
    execute,
  } = useAsyncData(
    () => `section-entry-drawer:${path}`,
    async () =>
      schema.parse(await $fetch(getEntryApiPath(path), { method: 'POST' })),
    { server: false, immediate: false, deep: false },
  );

  const isLoading = computed(
    () => status.value === 'idle' || status.value === 'pending',
  );

  const isError = computed(() => status.value === 'error');

  watch(
    isOpen,
    (value) => {
      if (value && !entry.value && status.value !== 'pending') {
        execute();
      }
    },
    { immediate: true },
  );
</script>

<template>
  <SectionDrawer
    v-model:open="isOpen"
    :title="entry?.name.rus ?? title"
    :subtitle="entry?.name.eng"
    :source="entry?.source"
    :path="path"
    :is-loading="isLoading"
    :is-error="isError"
  >
    <slot
      v-if="entry"
      :entry="entry"
    />
  </SectionDrawer>
</template>
