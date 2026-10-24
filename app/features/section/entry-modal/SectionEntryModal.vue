<script
  setup
  lang="ts"
  generic="T extends { name: EntryName; source?: EntrySource | null }"
>
  import type { z } from 'zod';

  import type { EntryName, EntrySource } from '../model';

  import { getEntryApiPath, SECTION_ICON, SECTION_TEXT } from '../model';
  import { SectionSourceTag } from '../source-tag';

  /**
   * Запись раздела в окне поверх страницы, как заклинание из вкладки
   * класса в старом SPA. Окно открыто, пока задан адрес записи.
   */
  const { schema } = defineProps<{
    schema: z.ZodType<T>;
  }>();

  /** Адрес открытой записи; `undefined` закрывает окно. */
  const path = defineModel<string>('path');

  defineSlots<{
    default: (props: { entry: T }) => unknown;
  }>();

  const isOpen = computed({
    get: () => !!path.value,
    set: (value: boolean) => {
      if (!value) {
        path.value = undefined;
      }
    },
  });

  const { data: entry, status } = useAsyncData(
    () => `section-entry-modal:${path.value ?? ''}`,
    async () =>
      path.value
        ? schema.parse(
            await $fetch(getEntryApiPath(path.value), { method: 'POST' }),
          )
        : null,
    { server: false, deep: false },
  );

  const isLoading = computed(() => status.value === 'pending');

  const isError = computed(() => status.value === 'error');
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="entry?.name.rus ?? ''"
    :description="entry?.name.eng ?? ''"
    :ui="{ content: 'max-w-3xl' }"
  >
    <template #description>
      <span class="flex items-center justify-between gap-2">
        <span class="truncate">{{ entry?.name.eng }}</span>

        <SectionSourceTag
          v-if="entry?.source"
          :source="entry.source"
        />
      </span>
    </template>

    <template #body>
      <div
        v-if="isLoading"
        class="flex flex-col gap-2"
      >
        <USkeleton
          v-for="index in 4"
          :key="index"
          class="h-6 w-full"
        />
      </div>

      <p v-else-if="isError">
        {{ SECTION_TEXT.detailError }}
      </p>

      <slot
        v-else-if="entry"
        :entry="entry"
      />
    </template>

    <template #footer>
      <UButton
        v-if="path"
        :to="path"
        :icon="SECTION_ICON.openPage"
        :label="SECTION_TEXT.openPage"
        color="neutral"
        variant="subtle"
      />
    </template>
  </UModal>
</template>
