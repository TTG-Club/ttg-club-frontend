<script setup lang="ts">
  import { cloneDeep } from 'lodash-es';

  import type {
    Filter,
    FilterComposable,
    FilterGroup,
    FilterItem,
  } from '@/shared/composable/useFilter';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';
  import BaseModal from '@/shared/ui/modals/BaseModal.vue';
  import { errorHandler } from '@/shared/utils/errorHandler';

  import FilterItemCheckboxes from '@/features/filter/FilterItem/FilterItemCheckboxes.vue';
  import FilterItemSources from '@/features/filter/FilterItem/FilterItemSources.vue';

  const props = withDefaults(
    defineProps<{
      filterInstance: FilterComposable;
      inTab?: boolean;
    }>(),
    {
      inTab: false,
    },
  );

  const emit = defineEmits<{
    (e: 'search', v: string): void;
    (e: 'update'): void;
  }>();

  const showed = ref(false);

  const emitSearch = useDebounceFn((value) => {
    emit('search', value);
  }, 500);

  const emitFilter = useDebounceFn(() => {
    emit('update');
  }, 500);

  const search = computed({
    get() {
      return props.filterInstance.search.value.value;
    },
    set(value: string) {
      emitSearch(props.filterInstance.search.updateSearch(value));
    },
  });

  const filter = computed<Filter | Array<FilterGroup> | undefined>({
    get: () => props.filterInstance.filter.value,
    set: async (value) => {
      try {
        if (!value) {
          return;
        }

        await props.filterInstance.saveFilter(value);

        await emitFilter();
      } catch (err) {
        errorHandler(err);
      }
    },
  });

  const otherFilters = computed({
    get(): Array<FilterGroup> {
      if (Array.isArray(filter.value)) {
        return filter.value;
      }

      return filter.value?.other || [];
    },

    set(value: Array<FilterGroup>) {
      if (Array.isArray(filter.value)) {
        filter.value = value;

        return;
      }

      if (filter.value?.other) {
        filter.value = {
          ...filter.value,
          other: value,
        };
      }
    },
  });

  const otherFiltered = computed(() =>
    otherFilters.value.filter((group: FilterGroup) => !group.hidden),
  );

  const isFilterCustomized = computed(
    () => props.filterInstance.isCustomized.value,
  );

  const setSourcesValue = (value: Array<FilterGroup>) => {
    if (!filter.value || Array.isArray(filter.value)) {
      return;
    }

    filter.value = {
      ...filter.value,
      sources: value,
    };
  };

  const setOtherValue = (value: Array<FilterItem>, key: string) => {
    const otherFiltersCopy = cloneDeep(otherFilters.value);
    const index = otherFiltersCopy.findIndex((group) => group.key === key);

    if (index > -1) {
      otherFiltersCopy[index].values = value;

      otherFilters.value = otherFiltersCopy;
    }
  };

  const resetFilter = async () => {
    await props.filterInstance.resetFilter();
    await emitFilter();
  };
</script>

<template>
  <div
    :class="{ 'in-tab': inTab }"
    class="filter"
  >
    <n-flex
      :wrap="false"
      size="small"
    >
      <n-input
        v-model:value.trim="search"
        :autocomplete="false"
        :spellcheck="false"
        placeholder="Поиск..."
        clearable
      >
        <template #prefix>
          <svg-icon icon="search" />
        </template>
      </n-input>

      <n-tooltip v-if="filter">
        <template #trigger>
          <n-button
            :type="isFilterCustomized ? 'warning' : 'primary'"
            @click.left.exact.prevent="showed = !showed"
          >
            <template #icon>
              <svg-icon
                :icon="`filter/${isFilterCustomized ? 'filled' : 'outline'}`"
              />
            </template>

            Фильтр
          </n-button>
        </template>

        <template #default>
          {{ showed ? 'Скрыть фильтры' : 'Показать фильтры' }}
        </template>
      </n-tooltip>

      <n-tooltip v-if="!!filter && isFilterCustomized">
        <template #trigger>
          <n-button
            type="warning"
            @click.left.exact.prevent="resetFilter"
          >
            <template #icon>
              <svg-icon icon="clear" />
            </template>
          </n-button>
        </template>

        <template #default> Сбросить все фильтры </template>
      </n-tooltip>
    </n-flex>

    <base-modal
      v-if="!!filter"
      v-model="showed"
    >
      <template #title> Фильтр </template>

      <template #default>
        <div class="filter__dropdown">
          <div class="filter__dropdown_body">
            <filter-item-sources
              v-if="filter?.sources"
              :model-value="filter.sources"
              @update:model-value="setSourcesValue($event)"
            />

            <filter-item-checkboxes
              v-for="(block, blockKey) in otherFiltered"
              :key="blockKey"
              :expand="block.expand || false"
              :model-value="block.values"
              :name="block.name"
              :type="block.type || 'crumb'"
              @update:model-value="setOtherValue($event, block.key)"
            />
          </div>
        </div>
      </template>

      <template #footer>
        <h5>Фильтры применяются автоматически!</h5>
      </template>
    </base-modal>
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;
  @use '@/assets/styles/variables/mixins' as *;

  .filter {
    position: relative;

    &__dropdown {
      width: 100%;

      &_body {
        padding: 16px;
      }
    }

    &.in-tab {
      padding: 0 16px;

      .filter {
        &__body {
          border-radius: 8px;
        }
      }

      @include media-min($xl) {
        padding: 0 24px;
      }
    }
  }

  :deep(.ui-input__control) {
    border: 0;
    background-color: transparent;

    .ui-input__input {
      padding: 0;
    }
  }
</style>
