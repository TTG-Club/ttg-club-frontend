<script lang="ts" setup>
  import {
    onKeyStroke,
    onStartTyping,
    useActiveElement,
    useFocus,
    useVModel,
  } from '@vueuse/core';
  import { debounce } from 'lodash-es';
  import { computed, onMounted, ref, watch } from 'vue';
  import { VueFinalModal } from 'vue-final-modal';
  import { useRouter } from 'vue-router';

  import { httpClient } from '@/shared/api';
  import { useMetrics } from '@/shared/composables/useMetrics';
  import type { IPaginatedResponse } from '@/shared/types/BaseApiFields';
  import type { TSearchResult } from '@/shared/types/search/Search';
  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';
  import UiInput from '@/shared/ui/kit/UiInput.vue';

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
  <vue-final-modal
    v-model="isShowModal"
    class="search-modal"
    content-transition="vfm-fade"
    esc-to-close
    focus-trap
    overlay-transition="vfm-fade"
    v-bind="$attrs"
    @opened="focused = true"
  >
    <div class="search-modal__container">
      <div class="search-modal__wrapper">
        <div class="search-modal__control">
          <div
            :class="{ 'in-progress': inProgress }"
            class="search-modal__control_icon"
          >
            <svg-icon :icon="inProgress ? 'dice/d20' : 'search'" />
          </div>

          <form
            autocapitalize="off"
            autocomplete="off"
            class="search-modal__control_field"
            novalidate="novalidate"
            @submit.prevent.stop="onSubmit"
          >
            <ui-input
              ref="input"
              :model-value="search"
              autocapitalize="off"
              autocomplete="off"
              autofocus="autofocus"
              formnovalidate="formnovalidate"
              placeholder="Поиск..."
              @update:model-value="onSearchUpdate"
              @keyup.enter.exact.prevent.stop="onSubmit"
            />
          </form>

          <div
            v-if="!inProgress && results?.total"
            class="search-modal__control__count"
          >
            Найдено: {{ results?.total }}
          </div>

          <ui-button
            class="search-modal__control_dice"
            icon="dice/d6"
            type="text"
            color="text"
            @click.left.exact.prevent="onSearchRandom"
          />
        </div>

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
  </vue-final-modal>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;
  @use '@/assets/styles/variables/mixins' as *;

  :deep(.search-modal) {
    pointer-events: none;
  }

  .search-modal {
    &__container {
      height: var(--max-vh);
      padding: 24px 24px 0;
      display: flex;
      flex-direction: column;
      max-width: 560px;
      width: 100vw;
      pointer-events: none;

      @include media-min($md) {
        padding: 56px 24px 0;
      }
    }

    &__wrapper {
      background: var(--bg-secondary);
      overflow: hidden;
      border-radius: 12px;
      width: 100%;
      pointer-events: auto;
      box-shadow: 0 22px 122px rgb(0 0 0 / 78%);
    }

    &__control {
      display: flex;
      padding: 0 4px;
      position: relative;

      &_field {
        flex: 1 1 100%;
        height: 44px;
        overflow: hidden;
        appearance: none;
        border: 0;
      }

      &__count {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-color);
        padding: 0 16px;
      }

      &_icon {
        svg {
          color: var(--text-color);
        }

        &.in-progress {
          svg {
            @keyframes loader {
              from {
                transform: rotate(0deg);
              }

              to {
                transform: rotate(360deg);
              }
            }

            animation: {
              name: loader;
              duration: 1.5s;
              iteration-count: infinite;
            }
          }
        }
      }

      &_dice {
        width: 36px;
        height: 36px;
        flex-shrink: 0;
        margin: 4px 0;

        svg {
          @include css_anim($item: transform);

          color: var(--text-color-title);
        }

        &:hover,
        &:focus-within {
          svg {
            transform: rotate(45deg);
          }
        }
      }

      &_icon {
        width: 36px;
        height: 36px;
        padding: 6px;
        flex-shrink: 0;
        margin: 4px 0;
      }
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
      @include css_anim();

      display: flex;
      align-items: center;
      padding: 6px 12px;
      color: var(--text-color-title);
      cursor: pointer;

      &:hover,
      &:focus-within {
        @include css_anim();

        background: var(--hover);
      }

      &_icon {
        width: 28px;
        height: 28px;
        padding: 2px;
      }
    }
  }

  :deep(.ui-input__control) {
    border: 0;
    background: transparent;

    .ui-input__input {
      color: var(--text-b-color);
      height: 44px;
    }
  }
</style>
