<script setup lang="ts">
  import { useDebounceFn } from '@vueuse/core';
  import { cloneDeep } from 'lodash-es';
  import { computed, ref } from 'vue';

  import type {
    Filter,
    FilterComposable,
    FilterGroup,
    FilterItem,
  } from '@/shared/composable/useFilter';
  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';
  import UiInput from '@/shared/ui/kit/UiInput.vue';
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
    <div class="filter__body">
      <div class="filter__search">
        <div
          class="filter__search_field"
          :class="{ 'has-filter': !!filter }"
        >
          <div class="filter__search_field_icon">
            <svg-icon icon="search" />
          </div>

          <ui-input
            v-model.trim="search"
            :autocomplete="false"
            :spellcheck="false"
            placeholder="Поиск..."
            is-clearable
          />
        </div>
      </div>

      <div class="filter__controls">
        <ui-button
          v-if="filter"
          :tooltip="{ content: showed ? 'Скрыть фильтры' : 'Показать фильтры' }"
          :icon="`filter/${isFilterCustomized ? 'filled' : 'outline'}`"
          :color="isFilterCustomized ? 'warning' : 'primary'"
          @click.left.exact.prevent="showed = !showed"
        >
          Фильтр
        </ui-button>

        <ui-button
          v-if="!!filter && isFilterCustomized"
          :tooltip="{ content: 'Сбросить все фильтры' }"
          icon="clear"
          color="warning"
          @click.left.exact.prevent="resetFilter"
        />
      </div>
    </div>

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

    &__body {
      width: 100%;
      display: flex;
      position: relative;
      overflow: hidden;
      gap: 8px;
    }

    &__search {
      flex: 1;
      display: flex;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;

      &_field {
        flex: 1;
        display: flex;
        align-items: center;
        cursor: text;

        &_icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--text-color);

          svg {
            width: 24px;
            height: 24px;
          }
        }

        &.has-filter {
          :deep(.ui-input__control) {
            border: {
              top-right-radius: 0;
              bottom-right-radius: 0;
            }
          }
        }
      }
    }

    &__controls {
      display: flex;
    }

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
