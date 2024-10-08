<script setup lang="ts">
  import { debounce } from 'lodash-es';

  import { httpClient } from '@/shared/api';
  import { useMetrics } from '@/shared/composable/useMetrics';
  import { useUIStore } from '@/shared/stores/UIStore';
  import type { IPaginatedResponse } from '@/shared/types/BaseApiFields';
  import type { TSearchResult } from '@/shared/types/search/Search';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import PageLayout from '@/layouts/PageLayout.vue';

  import SearchLink from '@/pages/search/SearchLink.vue';

  import type { LocationQueryValue, RouteLocationNormalized } from 'vue-router';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();
  const { bodyElement } = storeToRefs(uiStore);
  const { sendSearchMetrics, sendSearchViewResultsMetrics } = useMetrics();
  const inProgress = ref(false);
  const isNeedUpdateScroll = ref(false);
  const input = ref<HTMLElement>();
  const controls = ref<HTMLElement>();
  const controller = ref<AbortController>(new AbortController());
  const { focused } = useFocus(input, { initialValue: true });

  const page = ref(1);
  const search = ref('');

  const onUpdateRoute = (replace: boolean = false) => {
    const to = {
      name: 'search-page',
      query: {
        search: search.value.trim(),
        page: page.value || 1,
      },
    };

    if (replace) {
      return router.replace(to);
    }

    return router.push(to);
  };

  const resolveQuerySearch = (
    querySearch?: LocationQueryValue | LocationQueryValue[],
  ) => {
    if (!querySearch) {
      search.value = '';

      return;
    }

    if (Array.isArray(querySearch)) {
      search.value = '';

      return;
    }

    search.value = querySearch || '';
  };

  const resolveQueryPage = (
    queryPage?: LocationQueryValue | LocationQueryValue[],
  ) => {
    if (!search.value || Array.isArray(queryPage)) {
      page.value = 1;

      return;
    }

    if (typeof queryPage === 'string') {
      page.value = queryPage ? parseInt(queryPage, 10) : 1;

      return;
    }

    page.value = 1;
  };

  const resolveQuery = (to?: RouteLocationNormalized) => {
    resolveQuerySearch(to?.query.search);
    resolveQueryPage(to?.query.page);
  };

  const results = ref<IPaginatedResponse<TSearchResult>>({
    total: 0,
    items: [],
  });

  const pages = computed(() => {
    if (results.value?.total <= 20) {
      return 0;
    }

    return Math.ceil(results.value.total / 20);
  });

  const resultsNumbers = ref<null | { min: number; max: number }>(null);

  const onChangeSearch = debounce((value: string) => {
    isNeedUpdateScroll.value = true;

    if (value.trim()) {
      page.value = 1;
    }

    onUpdateRoute();
  }, 300);

  const onChangedPage = debounce(() => {
    isNeedUpdateScroll.value = true;

    onUpdateRoute();
  }, 300);

  const searchQuery = async () => {
    try {
      const resp = await httpClient.post<IPaginatedResponse<TSearchResult>>({
        url: '/search',
        payload: {
          page: page.value - 1,
          size: 20,
          search: {
            value: search.value.trim(),
            exact: false,
          },
          order: [],
        },
        signal: controller.value.signal,
      });

      if (resp.status !== 200) {
        return Promise.reject(resp.statusText);
      }

      sendSearchMetrics(search);

      return Promise.resolve(resp.data);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const onSearch = async () => {
    if (!search.value || inProgress.value) {
      return Promise.resolve();
    }

    try {
      inProgress.value = true;

      const result = await searchQuery();

      if (result.total && !result.items.length && page.value !== 1) {
        page.value = 1;

        await onUpdateRoute(true);

        return Promise.resolve();
      }

      results.value = result;

      if (isNeedUpdateScroll.value) {
        const controlsRect = controls.value?.getBoundingClientRect();

        if (!uiStore.bodyScroll.y || (controlsRect && controlsRect.top > 0)) {
          isNeedUpdateScroll.value = false;

          return Promise.resolve();
        }

        bodyElement.value?.scroll({
          top: 0,
          behavior: 'smooth',
        });

        isNeedUpdateScroll.value = false;
      }

      sendSearchViewResultsMetrics(
        search,
        result.items.map((item) => ({
          item_id: item.url,
          item_name: item.name,
          item_category: item.section,
          item_brand: item.source?.name,
        })),
      );

      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    } finally {
      inProgress.value = false;

      if (results.value?.total) {
        resultsNumbers.value = {
          min: page.value > 1 ? 20 * (page.value - 1) + 1 : 1,
          max:
            page.value < pages.value && results.value.total > 20
              ? 20 * page.value
              : results.value.total,
        };
      }

      if (!results.value?.total) {
        resultsNumbers.value = null;
      }
    }
  };

  onStartTyping(() => {
    focused.value = true;
  });

  tryOnBeforeMount(async () => {
    resolveQuery(route);

    await onUpdateRoute(true);

    if (!search.value.trim()) {
      return;
    }

    await onSearch();
  });

  onBeforeRouteUpdate(async (to, from, next) => {
    resolveQuery(to);

    if (search.value.trim()) {
      isNeedUpdateScroll.value = true;

      await onSearch();
    }

    next();
  });
</script>

<template>
  <page-layout class="search-view">
    <template #title> Поиск по сайту </template>

    <template #default>
      <div class="search-view__wrapper">
        <div
          ref="controls"
          class="search-view__controls"
        >
          <n-form
            novalidate="true"
            autocomplete="off"
            autofocus="autofocus"
            autocapitalize="off"
            @submit.prevent.stop="onSearch"
          >
            <n-input-group>
              <n-input
                v-model:value="search"
                size="large"
                placeholder="Поиск по сайту..."
                :autofocus="true"
                :input-props="{
                  autocapitalize: 'off',
                  autocomplete: 'off',
                  formnovalidate: true,
                }"
                clearable
                @clear="onChangeSearch('')"
                @update:value="onChangeSearch"
              >
                <template #prefix>
                  <svg-icon icon="search" />
                </template>
              </n-input>

              <n-button
                type="primary"
                size="large"
                @click.left.exact.prevent="onSearch"
              >
                Поиск
              </n-button>
            </n-input-group>
          </n-form>
        </div>

        <div
          v-if="resultsNumbers"
          class="search-view__total"
        >
          Результат: {{ resultsNumbers.min }}-{{ resultsNumbers.max }} из
          {{ results?.total }}
        </div>

        <div class="search-view__results">
          <search-link
            v-for="(res, key) in results?.items || []"
            :key="key"
            :search-link="res"
            show-desc
          />

          <div
            v-if="!search.trim().length && !results?.items.length"
            class="search-view__results_text"
          >
            Введите текст, чтобы начать
          </div>

          <div
            v-else-if="
              search.trim().length && inProgress && !results?.items.length
            "
            class="search-view__results_text"
          >
            Боги ищут ответ на твой запрос
          </div>

          <div
            v-else-if="!results?.items.length && !inProgress"
            class="search-view__results_text"
          >
            Боги не нашли ответа на твой запрос
          </div>
        </div>

        <n-pagination
          v-if="pages > 1"
          v-model:page="page"
          :page-count="pages"
          class="search-view__paginate"
          @update:page="onChangedPage"
        />
      </div>
    </template>
  </page-layout>
</template>

<style lang="scss" scoped>
  .search-view {
    &__wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100%;
    }

    &__controls {
      position: sticky;
      z-index: 10;
      top: 0;

      margin: -16px 0;
      padding: 16px 0;

      opacity: 1;
      background-color: var(--bg-main);
    }

    &__control {
      display: flex;

      &_body {
        overflow: hidden;
        display: flex;
        flex: 1 1 auto;
        background: var(--bg-sub-menu);
        border: {
          width: 1px;

          color: var(--border);

          radius: 8px 0 0 8px;
          right-width: 0;
          style: solid;
        }
      }

      &_icon {
        flex-shrink: 0;
        padding: 8px;
        font-size: 24px;

        svg {
          width: 26px;
          height: 26px;
          color: var(--text-color);
        }

        &.in-progress {
          svg {
            animation: {
              duration: 1.5s;
              iteration-count: infinite;
              name: loader;
            }

            @keyframes loader {
              from {
                transform: rotate(0deg);
              }

              to {
                transform: rotate(360deg);
              }
            }
          }
        }
      }

      &_btn {
        :deep(button) {
          padding: 13px 16px;
          border-radius: 0 8px 8px 0;
        }
      }
    }

    &__total {
      padding: 16px 12px 16px;
    }

    &__results {
      flex: 1 1 auto;

      &_text {
        display: flex;
        align-items: center;
        justify-content: center;

        padding: 32px 12px;

        color: var(--text-color);
      }
    }

    &__paginate {
      position: sticky;
      bottom: 0;

      margin: -8px 0 -24px 0;
      padding: 8px 0 16px 0;

      background-color: var(--bg-main);
      border-top-left-radius: 16px;
      border-top-right-radius: 16px;
    }
  }

  .search-link {
    margin-top: 8px;
    border-radius: 4px;
  }

  :deep(.ui-input__control) {
    border: 0;

    .ui-input__input {
      height: 42px;
      padding: 0;
      color: var(--text-b-color);
    }
  }
</style>
