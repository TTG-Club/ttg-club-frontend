<script setup lang="ts">
  import type { LocationQueryRaw } from 'vue-router';
  import type { FilterDefinition } from '~section/model';

  import { filterResponseSchema, normalizeFilter } from '~section/model';

  /**
   * Кнопка перехода в раздел с фильтром класса, как «Заклинания» на
   * new.ttg.club. Класс в фильтре раздела задаётся значением, а его знает
   * только фильтр класса, поэтому ссылка собирается из него. Пока фильтр
   * не пришёл, кнопки нет.
   */
  const { filterUrl, getLink, icon, label, text } = defineProps<{
    /** Ручка фильтра, в которой скрыто выбран сам класс. */
    filterUrl: string;
    /** Ссылка на раздел по фильтру класса. */
    getLink: (
      filter: FilterDefinition,
    ) => { path: string; query: LocationQueryRaw } | undefined;
    icon: string;
    /** Подпись над названием, например «Список:». */
    label: string;
    text: string;
  }>();

  const { data: link } = useLazyAsyncData(
    () => `class-filter-link-${filterUrl}`,
    async () =>
      getLink(
        normalizeFilter(
          filterResponseSchema.parse(
            await $fetch(filterUrl, { method: 'POST' }),
          ),
        ),
      ) ?? null,
    { deep: false },
  );
</script>

<template>
  <UButton
    v-if="link"
    :to="link"
    :icon="icon"
    target="_blank"
    variant="soft"
    color="neutral"
  >
    <span class="flex flex-col items-start leading-tight">
      <span class="text-xs text-muted">{{ label }}</span>

      <span>{{ text }}</span>
    </span>
  </UButton>
</template>
