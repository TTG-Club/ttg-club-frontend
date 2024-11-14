<script lang="ts" setup>
  import { debounce } from 'lodash-es';

  import { httpClient } from '@/shared/api';
  import { useMetrics } from '@/shared/composable/useMetrics';
  import type { IPaginatedResponse } from '@/shared/types/BaseApiFields';
  import type { TSearchResult } from '@/shared/types/search/Search';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import SearchLink from '@/pages/search/SearchLink.vue';

  const props = withDefaults(
    defineProps<{
      modelValue?: boolean;
    }>(),
    {
      modelValue: false,
    },
  );

  const isShowModal = useVModel(props, 'modelValue');
  const router = useRouter();

  const controller = ref<AbortController | null>(null);
  const search = ref('');
  const results = ref<IPaginatedResponse<TSearchResult> | null>(null);
  const inProgress = ref(false);
  const input = ref<HTMLElement | null>(null);
  const { focused } = useFocus(input, { initialValue: true });
  const selectedIndex = ref<number | null>(null);
  const activeElement = useActiveElement();

  const { sendSearchMetrics, sendSearchViewResultsMetrics } = useMetrics();

  const searchUrl = computed(() => ({
    path: '/search',
    query: {
      search: search.value,
      page: 1,
    },
  }));

  const onSearch = async () => {
    if (controller.value !== null) {
      controller.value.abort();
    }

    if (!search.value.trim()) {
      return Promise.resolve();
    }

    try {
      inProgress.value = true;
      controller.value = new AbortController();

      const resp = await httpClient.post<IPaginatedResponse<TSearchResult>>({
        url: '/search',
        payload: {
          page: 0,
          size: 5,
          search: {
            value: search.value,
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

      const result = resp.data;

      results.value = result;
      selectedIndex.value = null;

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
      results.value = null;

      return Promise.reject(err);
    } finally {
      controller.value = null;
      inProgress.value = false;
    }
  };

  const onSearchRandom = async () => {
    if (controller.value !== null) {
      controller.value.abort();
    }

    try {
      search.value = '';
      inProgress.value = true;
      controller.value = new AbortController();

      const resp = await httpClient.post<IPaginatedResponse<TSearchResult>>({
        url: '/search/random',
        payload: {
          page: 0,
          size: 5,
          search: null,
          order: [],
        },
        signal: controller.value.signal,
      });

      if (resp.status !== 200) {
        return Promise.reject(resp.statusText);
      }

      sendSearchMetrics('random');

      const result = resp.data;

      results.value = result;
      selectedIndex.value = null;

      sendSearchViewResultsMetrics(
        'random',
        result.items.map((item) => ({
          item_id: item.url,
          item_name: item.name,
          item_category: item.section,
          item_brand: item.source?.name,
        })),
      );

      return Promise.resolve();
    } catch (err) {
      results.value = null;

      return Promise.reject(err);
    } finally {
      controller.value = null;
      inProgress.value = false;
    }
  };

  onStartTyping(() => {
    focused.value = true;
    selectedIndex.value = null;
  });

  onMounted(() => {
    focused.value = true;
  });

  onKeyStroke('ArrowDown', (e) => {
    if (!isShowModal.value) {
      return;
    }

    e.preventDefault();

    focused.value = false;

    if (!results.value?.items.length) {
      return;
    }

    if (
      selectedIndex.value === null ||
      selectedIndex.value === results.value.items.length - 1
    ) {
      selectedIndex.value = 0;

      return;
    }

    selectedIndex.value++;
  });

  onKeyStroke('ArrowUp', (e) => {
    if (!isShowModal.value) {
      return;
    }

    e.preventDefault();

    focused.value = false;

    if (!results.value?.items.length) {
      return;
    }

    if (!selectedIndex.value) {
      selectedIndex.value = results.value.items.length - 1;

      return;
    }

    selectedIndex.value--;
  });

  const notUsingInput = computed(
    () =>
      activeElement.value?.tagName !== 'INPUT' &&
      activeElement.value?.tagName !== 'TEXTAREA',
  );

  onKeyStroke('Enter', (e) => {
    if (!isShowModal.value) {
      return;
    }

    e.preventDefault();

    if (!notUsingInput.value) {
      return;
    }

    if (
      typeof selectedIndex.value !== 'number' ||
      !results.value?.items.length
    ) {
      return;
    }

    const result = results.value.items[selectedIndex.value];

    if (!result) {
      return;
    }

    router.push({ path: result.url });
  });

  const onSubmit = () => {
    if (!focused.value) {
      return;
    }

    if (results.value?.items.length === 1) {
      router.push({ path: results.value.items[0].url });

      return;
    }

    router.push(searchUrl.value);
  };

  const onSearchDebounce = debounce(async () => {
    await onSearch();
  }, 300);

  const onSearchUpdate = (e: string) => {
    search.value = e;

    onSearchDebounce();
  };

  watch(isShowModal, (value) => {
    if (!value) {
      search.value = '';
      results.value = null;
    }
  });
</script>

<template>
  <n-modal v-model:show="isShowModal">
    <div class="search-modal">
      <div class="search-modal__container">
        <div class="search-modal__wrapper">
          <n-flex
            class="search-modal__control"
            :wrap="false"
            size="small"
          >
            <n-input
              ref="input"
              :value="search"
              :loading="inProgress"
              :autofocus="true"
              size="large"
              :input-props="{
                autocapitalize: 'off',
                autocomplete: 'off',
                formnovalidate: true,
              }"
              placeholder="Поиск..."
              :show-count="!!results?.total"
              @update:value="onSearchUpdate"
              @keyup.enter.exact.prevent.stop="onSubmit"
            >
              <template #prefix>
                <svg-icon icon="search" />
              </template>

              <template #count> Найдено: {{ results?.total }} </template>
            </n-input>

            <n-button
              secondary
              size="large"
              :loading="inProgress"
              @click.left.exact.prevent="onSearchRandom"
            >
              <template #icon>
                <svg-icon icon="dice/d6" />
              </template>
            </n-button>
          </n-flex>

          <div class="search-modal__results">
            <div
              v-if="!search.length && !results?.items.length"
              class="search-modal__text"
              @mouseenter.self="selectedIndex = null"
              @focusin.self="selectedIndex = null"
            >
              Введите текст, чтобы начать
            </div>

            <div
              v-else-if="search.length && !results?.items.length && inProgress"
              class="search-modal__text"
              @mouseenter.self="selectedIndex = null"
              @focusin.self="selectedIndex = null"
            >
              Боги ищут ответ на твой запрос
            </div>

            <div
              v-else-if="!results?.items.length && !inProgress"
              class="search-modal__text"
              @mouseenter.self="selectedIndex = null"
              @focusin.self="selectedIndex = null"
            >
              Боги не нашли ответа на твой запрос
            </div>

            <search-link
              v-for="(res, key) in results?.items || []"
              :key="key"
              :search-link="res"
              :selected="selectedIndex === key"
              disable-hover
              @focusin="selectedIndex = key"
              @mouseenter.self="selectedIndex = key"
            />

            <router-link
              :to="searchUrl"
              class="search-modal__all"
              @mouseenter.self="selectedIndex = null"
              @focusin.self="selectedIndex = null"
            >
              <div class="search-modal__all_icon">
                <svg-icon icon="search-page" />
              </div>

              <div class="search-modal__all_body">Открыть страницу поиска</div>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </n-modal>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;
  @use '@/assets/styles/variables/mixins' as *;

  .search-modal {
    pointer-events: none;
    width: 100vw;
    max-width: 560px;

    &__container {
      pointer-events: none;

      display: flex;
      flex-direction: column;

      width: 100%;
      height: var(--max-vh);
      padding: 24px 24px 0;

      @include media-min($md) {
        padding: 56px 24px 0;
      }
    }

    &__wrapper {
      pointer-events: auto;

      overflow: hidden;

      width: 100%;

      background: var(--bg-secondary);
      border-radius: 12px;
      box-shadow: var(--n-box-shadow);
    }

    &__control {
      position: relative;
      padding: 8px;
    }

    &__results {
      user-select: none;
      padding: 8px 0 0;
    }

    &__text {
      display: flex;
      align-items: center;
      justify-content: center;

      padding: 6px 12px;

      color: var(--text-color);
    }

    &__all {
      cursor: pointer;

      display: flex;
      align-items: center;

      padding: 6px 12px;

      color: var(--text-color-title);

      @include css-anim();

      &:hover,
      &:focus-within {
        background: var(--hover);

        @include css-anim();
      }

      &_icon {
        width: 28px;
        height: 28px;
        padding: 2px;
        font-size: 24px;
      }
    }
  }

  :deep(.ui-input__control) {
    background: transparent;
    border: 0;

    .ui-input__input {
      height: 44px;
      color: var(--text-b-color);
    }
  }
</style>
