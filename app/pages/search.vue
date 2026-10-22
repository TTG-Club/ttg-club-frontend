<script setup lang="ts">
  import { useSiteSearch } from '~infrastructure/search/composables';
  import {
    getSearchPage,
    getSearchPageCount,
    getSearchRange,
    SEARCH_DEBOUNCE_MS,
    SEARCH_ICON,
    SEARCH_PAGE_QUERY_KEY,
    SEARCH_PAGE_SIZE,
    SEARCH_QUERY_KEY,
    SEARCH_TEXT,
  } from '~infrastructure/search/model';
  import { SearchResultLink } from '~infrastructure/search/result';
  import { getQueryString } from '~section/model';

  const route = useRoute();

  const term = computed(
    () => getQueryString(route.query[SEARCH_QUERY_KEY])?.trim() ?? '',
  );

  const page = computed(() =>
    getSearchPage(route.query[SEARCH_PAGE_QUERY_KEY]),
  );

  const input = ref('');

  // Строка поиска пишется в адрес без новой записи в истории: шаг «назад»
  // должен вести со страницы поиска, а не по буквам запроса
  watchDebounced(
    input,
    (value) => {
      const next = value.trim();

      if (next === term.value) {
        return;
      }

      navigateTo(
        { query: { [SEARCH_QUERY_KEY]: next || undefined } },
        { replace: true },
      );
    },
    { debounce: SEARCH_DEBOUNCE_MS },
  );

  // Адрес сменился снаружи — «назад» или ссылка из окна поиска
  watch(
    term,
    (value) => {
      if (value !== input.value.trim()) {
        input.value = value;
      }
    },
    { immediate: true },
  );

  const { data, status, error } = await useSiteSearch({
    key: 'search-page',
    term,
    page,
    size: SEARCH_PAGE_SIZE,
  });

  const pageCount = computed(() =>
    getSearchPageCount(data.value.total, SEARCH_PAGE_SIZE),
  );

  const range = computed(() =>
    getSearchRange(page.value, SEARCH_PAGE_SIZE, data.value.total),
  );

  const currentPage = computed({
    get: () => page.value,
    set: (value: number) => {
      navigateTo({
        query: {
          ...route.query,
          [SEARCH_PAGE_QUERY_KEY]: value > 1 ? String(value) : undefined,
        },
      });
    },
  });

  const statusText = computed(() => {
    if (!term.value) {
      return SEARCH_TEXT.start;
    }

    if (status.value === 'pending') {
      return SEARCH_TEXT.loading;
    }

    if (error.value) {
      return SEARCH_TEXT.error;
    }

    return SEARCH_TEXT.empty;
  });

  watch(page, () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
    <h1 class="font-serif text-3xl text-title">
      {{ SEARCH_TEXT.title }}
    </h1>

    <UInput
      v-model="input"
      :icon="SEARCH_ICON.search"
      :placeholder="SEARCH_TEXT.pagePlaceholder"
      :loading="status === 'pending'"
      autocomplete="off"
      autocapitalize="off"
      size="xl"
      autofocus
      class="w-full"
    />

    <p
      v-if="range"
      class="text-sm text-muted"
    >
      {{ SEARCH_TEXT.range }} {{ range.from }}–{{ range.to }}
      {{ SEARCH_TEXT.of }} {{ data.total }}
    </p>

    <div
      v-if="data.items.length"
      class="flex flex-col gap-2"
    >
      <SearchResultLink
        v-for="result in data.items"
        :key="result.url"
        :result="result"
      />
    </div>

    <p
      v-else
      class="py-6 text-center text-muted"
    >
      {{ statusText }}
    </p>

    <UPagination
      v-if="pageCount > 1"
      v-model:page="currentPage"
      :total="data.total"
      :items-per-page="SEARCH_PAGE_SIZE"
      class="self-center"
    />
  </div>
</template>
