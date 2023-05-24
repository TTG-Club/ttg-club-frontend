<template>
  <component
    :is="layout"
    :filter-instance="filter"
    :show-right-side="showRightSide"
    title="Заклинания"
    @search="onSearch"
    @update="initPages"
    @list-end="nextPage"
  >
    <virtual-grouped-list
      :list="getListProps({ items: spells })"
      :get-group="getSpellGroup"
      :grid="{ flat: showRightSide }"
    >
      <template #default="{ item: spell }">
        <spell-link
          :in-tab="inTab"
          :spell="spell"
          :to="{ path: spell.url }"
        />
      </template>
    </virtual-grouped-list>
  </component>
</template>

<script lang="ts">
  import type { PropType } from 'vue';
  import {
    computed, defineComponent, onBeforeMount, watch
  } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useRoute, useRouter } from 'vue-router';
  import ContentLayout from '@/components/content/ContentLayout.vue';
  import TabLayout from '@/components/content/TabLayout.vue';
  import SpellLink from '@/views/Character/Spells/SpellLink.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import { useFilter } from '@/common/composition/useFilter';
  import { usePagination } from '@/common/composition/usePagination';
  import { SpellsFilterDefaults, TSpellLink } from '@/types/Character/Spells.types';
  import VirtualGroupedList from '@/components/list/VirtualGroupedList/VirtualGroupedList.vue';
  import type { AnyObject } from '@/types/Shared/Utility.types';
  import { DEFAULT_ENTITY_KEY_FIELD } from "@/common/const";
  import { getListProps } from "@/components/list/VirtualList/helpers";

  export default defineComponent({
    components: {
      VirtualGroupedList,
      SpellLink,
      TabLayout,
      ContentLayout
    },
    props: {
      inTab: {
        type: Boolean,
        default: false
      },
      storeKey: {
        type: String,
        default: ''
      },
      filterUrl: {
        type: String,
        default: undefined
      },
      queryBooks: {
        type: Array as PropType<Array<string>>,
        default: undefined
      }
    },
    setup(props) {
      const route = useRoute();
      const router = useRouter();
      const uiStore = useUIStore();

      const {
        isMobile,
        fullscreen
      } = storeToRefs(uiStore);

      const layout = computed(() => (
        props.inTab
          ? TabLayout
          : ContentLayout
      ));

      const filter = useFilter({
        dbName: SpellsFilterDefaults.dbName,
        storeKey: computed(() => props.storeKey),
        url: computed(() => props.filterUrl || SpellsFilterDefaults.url)
      });

      const isCustomized = computed(() => !!props.queryBooks || filter.isCustomized.value);

      const queryParams = computed(() => {
        if (props.queryBooks) {
          return {
            ...filter.queryParams.value,
            book: props.queryBooks
          };
        }

        return filter.queryParams.value;
      });

      const {
        initPages,
        nextPage,
        resetPages,
        items: spells
      } = usePagination<TSpellLink[]>({
        url: '/spells',
        filter: {
          isCustomized,
          value: queryParams
        },
        search: filter.search,
        order: [
          {
            field: 'level',
            direction: 'asc'
          },
          {
            field: 'name',
            direction: 'asc'
          }
        ]
      });

      const onSearch = async () => {
        await initPages();

        if (spells.value.length === 1 && !isMobile.value && !props.inTab) {
          await router.push({ path: spells.value[0].url });
        }
      };

      onBeforeMount(async () => {
        await filter.initFilter();
        await initPages();
      });

      watch(
        [
          () => props.queryBooks,
          () => props.filterUrl,
          () => props.storeKey
        ],
        async () => {
          await resetPages();
          await filter.initFilter();
          await initPages();
        },
        {
          deep: true
        }
      );

      /* TODO: Добавить тип заклинания */
      const getSpellGroup = ({ level }: AnyObject) => ({
        url: `${ level }`,
        name: level ? `${ level } уровень` : 'Заговоры',
        order: level
      });

      const showRightSide = computed(() => route.name === 'spellDetail');

      return {
        layout,
        isMobile,
        fullscreen,
        spells,
        filter,
        showRightSide,
        initPages,
        nextPage,
        onSearch,
        getSpellGroup,
        DEFAULT_ENTITY_KEY_FIELD
      };
    },
    methods: { getListProps }
  });
</script>
