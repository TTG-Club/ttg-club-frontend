<script setup lang="ts">
  import { cloneDeep } from 'lodash-es';

  import type { FilterItem } from '@/shared/composable/useFilter';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  const props = withDefaults(
    defineProps<{
      name: string;
      type: 'crumb' | 'toggle';
      expand?: boolean;
    }>(),
    {
      expand: false,
    },
  );

  const filterItem = ref<HTMLDivElement>();

  const model = defineModel<Array<FilterItem>>({ default: () => [] });

  const isFilterCustomized = computed(() => {
    if (!model.value) {
      return false;
    }

    for (const value of model.value) {
      if (value.value !== value.default) {
        return true;
      }
    }

    return false;
  });

  const opened = ref<boolean>(
    isFilterCustomized.value || props.expand || false,
  );

  function resetValues() {
    model.value = cloneDeep(model.value).map((value) => ({
      ...value,
      value: value.default,
    }));
  }

  function setValue(newValue: boolean, index: number) {
    const values = cloneDeep(model.value);

    values[index].value = newValue;

    model.value = values;
  }

  function toggleBlock() {
    opened.value = !opened.value;

    filterItem.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }
</script>

<template>
  <div
    v-if="modelValue?.length"
    ref="filterItem"
    :class="{ 'is-active': opened }"
    class="filter-item"
  >
    <div class="filter-item__header">
      <div
        class="filter-item__trigger"
        @click.left.exact.prevent="toggleBlock"
      >
        <div class="filter-item__name">
          {{ name }}
        </div>

        <button
          class="filter-item__button filter-item__button--toggle"
          type="button"
          @click.self.left.exact.prevent.stop="toggleBlock"
        >
          <svg-icon
            :icon="`arrow/${opened ? 'up' : 'down'}`"
            size="24"
          />
        </button>
      </div>

      <n-tooltip v-if="isFilterCustomized">
        <template #trigger>
          <button
            class="filter-item__button filter-item__button--reset"
            type="button"
            @click.left.exact.prevent="resetValues"
          >
            <svg-icon
              icon="close"
              size="24"
            />
          </button>
        </template>

        <template #default>
          {{ `Сбросить блок «${name}»` }}
        </template>
      </n-tooltip>
    </div>

    <div
      v-if="opened"
      :class="{ 'is-toggle': type === 'toggle' }"
      class="filter-item__body"
    >
      <n-tooltip
        v-for="(checkbox, checkboxKey) in model"
        :key="checkboxKey"
        :disabled="!checkbox.tooltip"
      >
        <template #trigger>
          <n-checkbox
            v-if="type === 'toggle'"
            :checked="checkbox.value"
            @update:checked="setValue($event, checkboxKey)"
          >
            {{ checkbox.label }}
          </n-checkbox>

          <n-tag
            v-if="type === 'crumb'"
            :checked="checkbox.value"
            checkable
            round
            @update:checked="setValue($event, checkboxKey)"
          >
            {{ checkbox.label }}
          </n-tag>
        </template>

        <template #default>
          {{ checkbox.tooltip }}
        </template>
      </n-tooltip>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/modules/filter-item' as *;
</style>
