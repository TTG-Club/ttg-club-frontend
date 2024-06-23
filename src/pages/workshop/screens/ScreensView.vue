<script setup lang="ts">
  import { useFilter } from '@/shared/composable/useFilter';
  import { usePagination } from '@/shared/composable/usePagination';
  import { ScreensFilterDefaults } from '@/shared/types/workshop/Screens.d';
  import { isAutoOpenAvailable } from '@/shared/utils/isAutoOpenAvailable';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  const route = useRoute();
  const router = useRouter();

  const filter = useFilter({
    dbName: ScreensFilterDefaults.dbName,
    url: ScreensFilterDefaults.url,
  });

  const {
    initPages,
    nextPage,
    isEnd,
    items: screens,
  } = usePagination({
    url: '/screens',
    filter: {
      isCustomized: filter.isCustomized,
      value: filter.queryParams,
    },
    search: filter.search,
    order: [
      {
        field: 'ordering',
        direction: 'asc',
      },
      {
        field: 'name',
        direction: 'asc',
      },
    ],
  });

  const onSearch = async () => {
    await initPages();

    if (isAutoOpenAvailable(screens)) {
      await router.push({ path: screens.value[0].url });
    }
  };

  onBeforeMount(async () => {
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'screenDetail');
</script>

<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    :is-end="isEnd"
    :on-load-more="nextPage"
    title="Ширма (Справочник)"
    @search="onSearch"
  >
    <div
      :class="{ 'is-selected': showRightSide }"
      class="screen-items"
    >
      <router-link
        v-for="screen in screens"
        :key="screen.url"
        :to="screen.url"
        class="screen-item"
      >
        <div class="screen-item__name--rus">
          {{ screen.name.rus }}
        </div>

        <div class="screen-item__name--eng">
          {{ screen.name.eng }}
        </div>
      </router-link>
    </div>
  </content-layout>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;
  @use '@/assets/styles/variables/mixins' as *;

  .screen-items {
    width: 100%;
    display: grid;
    grid-gap: 16px;
    align-items: start;
    grid-template-columns: repeat(1, 1fr);

    @include media-min($sm) {
      grid-template-columns: repeat(2, 1fr);
    }

    @include media-min($lg) {
      grid-template-columns: repeat(3, 1fr);
    }

    @include media-min($xxl) {
      grid-template-columns: repeat(4, 1fr);
    }

    &.is-selected {
      @include media-min($sm) {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  }

  .screen-item {
    @include css_anim();

    display: block;
    width: 100%;
    background-color: var(--bg-table-list);
    border-radius: 12px;
    border: 1px solid transparent;
    padding: 12px;
    color: var(--text-color-title);

    @include media-min($xl) {
      padding: 16px;
    }

    &__name {
      &--rus {
        font-size: calc(var(--h5-font-size) + 2px);
        margin: 0;
        font-weight: 500;
        line-height: normal;
        display: block;
      }

      &--eng {
        margin-top: 4px;
        font-size: calc(var(--h5-font-size) - 1px);
      }
    }

    &:hover {
      &:not(.router-link-active) {
        background-color: var(--bg-secondary);
      }
    }

    &.router-link-active {
      border-color: var(--primary-active);
    }
  }
</style>
