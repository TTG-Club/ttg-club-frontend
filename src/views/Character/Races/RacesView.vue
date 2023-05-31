<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    title="Расы и происхождения"
    @search="onSearch"
    @update="initPages"
  >
    <div
      :class="{ 'is-selected': showRightSide, 'is-fullscreen': fullscreen }"
      class="race-items"
    >
      <div
        v-for="(group, groupKey) in sortedRaces"
        :key="groupKey"
        class="race-items__group"
      >
        <div
          v-if="group.group?.name"
          class="race-items__group_name"
        >
          {{ group.group.name }}
        </div>

        <div class="race-items__group_list">
          <race-link
            v-for="el in group.list"
            :key="el.url"
            :race-item="el"
            :to="{ path: el.url }"
          />
        </div>
      </div>
    </div>
  </content-layout>
</template>

<script lang="ts">
  import { storeToRefs } from 'pinia';
  import {
    computed, defineComponent, nextTick, onBeforeMount, ref, watch, provide
  } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import sortBy from 'lodash/sortBy';
  import groupBy from 'lodash/groupBy';
  import cloneDeep from 'lodash/cloneDeep';
  import { toValue } from '@vueuse/shared';
  import ContentLayout from '@/components/content/ContentLayout.vue';
  import RaceLink from '@/views/Character/Races/RaceLink.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import { useFilter } from '@/common/composition/useFilter';
  import { usePagination } from '@/common/composition/usePagination';
  import type { TRaceLink, TRaceList } from '@/types/Character/Races.types';
  import { RacesFilterDefaults } from '@/types/Character/Races.types';
  import { isAutoOpenAvailable } from '@/common/helpers/isAutoOpenAvailable';
  import { DEFAULT_QUERY_BOOKS_INJECT_KEY } from '@/common/const';

  export default defineComponent({

    components: {
      RaceLink,
      ContentLayout
    },
    setup() {
      const route = useRoute();
      const router = useRouter();
      const uiStore = useUIStore();

      const {
        isMobile,
        fullscreen
      } = storeToRefs(uiStore);

      const showRightSide = ref(false);

      const filter = useFilter({
        dbName: RacesFilterDefaults.dbName,
        url: RacesFilterDefaults.url
      });

      const {
        initPages,
        items: races
      } = usePagination({
        url: '/races',
        limit: -1,
        filter: {
          isCustomized: filter.isCustomized,
          value: filter.queryParams
        },
        search: filter.search,
        order: [
          {
            field: 'name',
            direction: 'asc'
          }
        ]
      });

      watch(
        [races, () => route.name],
        () => {
          nextTick(() => {
            showRightSide.value = !!races.value.length && route.name === 'raceDetail';
          });
        },
        { flush: 'post' }
      );

      const onSearch = async () => {
        await initPages();

        if (isAutoOpenAvailable(races)) {
          await router.push({ path: races.value[0].url });
        }
      };

      const sortedRaces = computed((): Array<TRaceList> => {
        if (!races.value?.length) {
          return [];
        }

        const getGroupArchetypes = (list: Array<TRaceLink>): Array<TRaceList> => sortBy(
          Object.values(groupBy(list, o => o.type.name))
            .map(value => ({
              group: value[0].type,
              list: value
            })),
          [o => o.group.order]
        );

        const getGroupClasses = (): Array<TRaceList> => {
          const newClasses: Array<TRaceLink> = races.value.map(race => ({
            ...race,
            archetypes: getGroupArchetypes(race.archetypes)
          }));

          const defaultGroup: TRaceList = {
            list: sortBy(
              newClasses.filter(item => !('group' in item)),
              [o => o.name.rus]
            )
          };

          const mapped: Array<TRaceList> = sortBy(
            Object.values(groupBy(
              cloneDeep(newClasses.filter((item: TRaceLink) => 'group' in item)),
              (o: TRaceLink) => o.group?.name
            ) as { [key: string]: Array<TRaceLink> })
              .map(classList => ({
                group: classList[0].group!,
                list: sortBy(
                  classList,
                  [o => o.name.rus]
                )
              })),
            [o => o.group!.order]
          );

          return [defaultGroup, ...mapped];
        };

        return getGroupClasses();
      });

      onBeforeMount(async () => {
        await filter.initFilter();
        await initPages();
      });

      const books = computed(() => {
        const params = toValue(filter.queryParams);

        if (params?.book instanceof Array) {
          return params.book;
        }

        return [];
      });

      provide(DEFAULT_QUERY_BOOKS_INJECT_KEY, books);

      return {
        isMobile,
        fullscreen,
        races,
        sortedRaces,
        filter,
        showRightSide,
        initPages,
        onSearch
      };
    }
  });
</script>

<style lang="scss" scoped>
  .race-items {
    &__group {
      &_name {
        font-size: var(--h3-font-size);
        font-weight: 300;
        margin: 24px 0 16px 0;
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

        @include media-min($sm) {
          grid-template-columns: repeat(2, 1fr);
        }

        @include media-min($lg) {
          grid-template-columns: repeat(4, 1fr);
        }

        @include media-min($xxl) {
          grid-template-columns: repeat(5, 1fr);
        }
      }
    }

    &.is-selected {
      .race-items {
        &__group {
          &_list {
            @include media-min($sm) {
              grid-template-columns: repeat(2, 1fr);
            }
          }
        }
      }
    }
  }
</style>
