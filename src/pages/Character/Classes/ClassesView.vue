<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    title="Классы"
    @search="initPages"
    @update="initPages"
  >
    <div
      :class="{ 'is-selected': showRightSide, 'is-fullscreen': fullscreen }"
      class="class-items"
    >
      <div
        v-for="(group, groupKey) in sortedClasses"
        :key="groupKey"
        class="class-items__group"
      >
        <div
          v-if="group.group?.name"
          class="class-items__group_name"
        >
          {{ group.group.name }}
        </div>

        <div class="class-items__group_list">
          <class-link
            v-for="el in group.list"
            :key="el.url"
            :after-search="!!filter.search.value"
            :class-item="el"
            :to="{ path: el.url }"
          />
        </div>
      </div>
    </div>
  </content-layout>
</template>

<script lang="ts" setup>
  import { toValue } from '@vueuse/shared';
  import { cloneDeep, groupBy, sortBy } from 'lodash-es';
  import { storeToRefs } from 'pinia';
  import { computed, nextTick, onBeforeMount, provide, ref, watch } from 'vue';
  import { useRoute } from 'vue-router';

  import ClassLink from '@/pages/Character/Classes/ClassLink.vue';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  import { useFilter } from '@/shared/compositions/useFilter';
  import { usePagination } from '@/shared/compositions/usePagination';
  import { DEFAULT_QUERY_BOOKS_INJECT_KEY } from '@/shared/constants';
  import { useUIStore } from '@/shared/stores/UIStore';
  import type {
    TClassArchetype,
    TClassArchetypeList,
    TClassItem,
    TClassList
  } from '@/shared/types/Character/Classes.d';
  import { ClassesFilterDefaults } from '@/shared/types/Character/Classes.d';

  const uiStore = useUIStore();
  const route = useRoute();
  const showRightSide = ref(false);

  const filter = useFilter({
    dbName: ClassesFilterDefaults.dbName,
    url: ClassesFilterDefaults.url
  });

  const { fullscreen } = storeToRefs(uiStore);

  const { initPages, items: classes } = usePagination({
    url: '/classes',
    limit: -1,
    filter: {
      isCustomized: filter.isCustomized,
      value: filter.queryParams
    },
    search: filter.search
  });

  watch(
    [classes, () => route.name],
    () => {
      nextTick(() => {
        showRightSide.value =
          !!classes.value.length && route.name === 'classDetail';
      });
    },
    { flush: 'post' }
  );

  const sortedClasses = computed((): Array<TClassList> => {
    if (!classes.value?.length) {
      return [];
    }

    const getGroupArchetypes = (
      list: Array<TClassArchetype>
    ): Array<TClassArchetypeList> =>
      sortBy(
        Object.values(groupBy(list, o => o.type.name)).map(value => ({
          group: value[0].type,
          list: value
        })),
        [o => o.group.order]
      );

    const getGroupClasses = (): Array<TClassList> => {
      const newClasses: Array<TClassItem> = classes.value.map(classItem => ({
        ...classItem,
        archetypes: getGroupArchetypes(classItem.archetypes)
      }));

      const defaultGroup: TClassList = {
        list: sortBy(
          newClasses.filter(item => !('group' in item)),
          [o => o.name.rus]
        )
      };

      const mapped: Array<TClassList> = sortBy(
        Object.values(
          groupBy(
            cloneDeep(newClasses.filter((item: TClassItem) => 'group' in item)),
            (o: TClassItem) => o.group?.name
          ) as { [key: string]: Array<TClassItem> }
        ).map(classList => ({
          group: classList[0].group!,
          list: sortBy(classList, [o => o.name.rus])
        })),
        [o => o.group!.order]
      );

      return [defaultGroup, ...mapped];
    };

    return getGroupClasses();
  });

  const books = computed(() => {
    const params = toValue(filter.queryParams);

    if (params?.book instanceof Array) {
      return params.book;
    }

    return [];
  });

  provide(DEFAULT_QUERY_BOOKS_INJECT_KEY, books);

  onBeforeMount(async () => {
    await filter.initFilter();
    await initPages();
  });
</script>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;

  .class-items {
    &__group {
      &_name {
        font-size: var(--h2-font-size);
        font-weight: 300;
        margin: 32px 0 24px 0;
        color: var(--text-color-title);
        position: relative;
        font-family: 'Lora', sans-serif;
      }

      &_list {
        width: 100%;
        padding: 0;
        display: grid;
        grid-gap: 16px;
        align-items: start;
        grid-template-columns: repeat(1, 1fr);

        @include media-min($md) {
          grid-template-columns: repeat(2, 1fr);
        }

        @include media-min($xl) {
          grid-template-columns: repeat(3, 1fr);
        }
      }
    }

    &.is-selected {
      .class-items {
        &__group {
          &_list {
            @include media-min($md) {
              grid-template-columns: repeat(1, 1fr);
            }
          }
        }
      }
    }
  }
</style>
