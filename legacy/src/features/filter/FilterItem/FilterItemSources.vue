<script setup lang="ts">
  import { cloneDeep } from 'lodash-es';

  import type { FilterGroup } from '@/shared/composable/useFilter';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  const model = defineModel<Array<FilterGroup>>({ default: undefined });

  const opened = ref(true);

  const isFilterCustomized = computed(() => {
    if (!model.value) {
      return false;
    }

    for (const group of model.value) {
      for (const value of group.values) {
        if (value.value !== value.default) {
          return true;
        }
      }
    }

    return false;
  });

  function setGroupStatus(e: boolean, index: number) {
    if (!model.value[index]?.values?.length) {
      return;
    }

    const sources = cloneDeep(model.value);

    for (let i = 0; i < sources[index].values.length; i++) {
      sources[index].values[i].value = e;
    }

    model.value = sources;
  }

  function isGroupActive(index: number) {
    if (!model.value[index]?.values?.length) {
      return false;
    }

    for (let i = 0; i < model.value[index].values.length; i++) {
      if (model.value[index].values[i].value) {
        return true;
      }
    }

    return false;
  }

  function resetSources() {
    model.value = cloneDeep(model.value).map((group) => ({
      ...group,
      values: group.values.map((value) => ({
        ...value,
        value: value.default,
      })),
    }));
  }

  function setSourceValue(
    newValue: boolean,
    groupKey: number,
    checkboxKey: number,
  ) {
    const sources = cloneDeep(model.value);

    sources[groupKey].values[checkboxKey].value = newValue;

    model.value = sources;
  }
</script>

<template>
  <div
    v-if="model?.length"
    :class="{ 'is-active': opened }"
    class="filter-item"
  >
    <div class="filter-item__header">
      <div
        class="filter-item__trigger"
        @click.left.exact.prevent="opened = !opened"
      >
        <div class="filter-item__name">Источники</div>

        <button
          class="filter-item__button filter-item__button--toggle"
          type="button"
          @click.self.left.exact.prevent="opened = !opened"
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
            @click.left.exact.prevent="resetSources"
          >
            <svg-icon
              icon="close"
              size="24"
            />
          </button>
        </template>

        <template #default> Сбросить источники </template>
      </n-tooltip>
    </div>

    <div
      v-if="opened"
      class="filter-item__body"
    >
      <div
        v-for="(group, groupKey) in model"
        v-show="!!group.values?.length"
        :key="groupKey"
        class="filter-item__source-group"
      >
        <div
          v-if="group.name"
          class="filter-item__source-group_head"
        >
          <div class="filter-item__source-group_name">
            {{ group.name }}
          </div>

          <n-tooltip>
            <template #trigger>
              <n-switch
                size="small"
                :value="isGroupActive(groupKey)"
                @update:value="setGroupStatus($event, groupKey)"
              />
            </template>

            <template #default>
              {{
                `${isGroupActive(groupKey) ? 'Выключить' : 'Включить'} «${group.name}»`
              }}
            </template>
          </n-tooltip>
        </div>

        <div class="filter-item__source-group_body">
          <n-tooltip
            v-for="(checkbox, checkboxKey) in group.values"
            :key="checkboxKey"
            :disabled="!checkbox.tooltip"
          >
            <template #trigger>
              <n-tag
                :checked="checkbox.value"
                checkable
                round
                @update:checked="setSourceValue($event, groupKey, checkboxKey)"
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
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/modules/filter-item' as *;

  .filter-item {
    border-color: var(--primary);

    &__body {
      flex-direction: column;
      flex-wrap: nowrap;
      gap: initial;
    }

    &__source-group {
      & + & {
        margin-top: 16px;
      }

      &_head {
        cursor: default;
        display: flex;
        align-items: center;

        & + .filter-item {
          &__source-group {
            &_body {
              margin-top: 8px;
            }
          }
        }
      }

      &_name {
        display: flex;
        flex: 1;
        align-items: center;
        padding-right: 8px;

        &:after {
          content: '';

          display: block;
          flex: 1;

          height: 1px;
          margin-left: 8px;

          background-color: var(--border);
        }
      }

      &_body {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
    }
  }
</style>
