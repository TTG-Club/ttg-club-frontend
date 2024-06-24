<script>
  import { cloneDeep } from 'lodash-es';

  import { SvgIcon } from '@/shared/ui/icons/svg-icon';
  import UiCheckbox from '@/shared/ui/kit/UiCheckbox.vue';

  export default {
    components: {
      UiCheckbox,
      SvgIcon,
    },
    props: {
      modelValue: {
        type: Array,
        default: undefined,
      },
    },
    emits: ['update:model-value'],
    data: () => ({
      opened: true,
    }),
    computed: {
      isFilterCustomized() {
        if (!this.modelValue) {
          return false;
        }

        for (const group of this.modelValue) {
          for (const value of group.values) {
            if (value.value !== value.default) {
              return true;
            }
          }
        }

        return false;
      },
    },
    methods: {
      setGroupStatus(e, index) {
        if (!this.modelValue[index]?.values?.length) {
          return;
        }

        const sources = cloneDeep(this.modelValue);

        for (let i = 0; i < sources[index].values.length; i++) {
          sources[index].values[i].value = e;
        }

        this.emitSources(sources);
      },

      isGroupActive(index) {
        if (!this.modelValue[index]?.values?.length) {
          return false;
        }

        for (let i = 0; i < this.modelValue[index].values.length; i++) {
          if (this.modelValue[index].values[i].value) {
            return true;
          }
        }

        return false;
      },

      resetSources() {
        const sources = cloneDeep(this.modelValue).map((group) => ({
          ...group,
          values: group.values.map((value) => ({
            ...value,
            value: value.default,
          })),
        }));

        this.emitSources(sources);
      },

      setSourceValue(newValue, groupKey, checkboxKey) {
        const sources = cloneDeep(this.modelValue);

        sources[groupKey].values[checkboxKey].value = newValue;

        this.emitSources(sources);
      },

      emitSources(sources) {
        this.$emit('update:model-value', sources);
      },
    },
  };
</script>

<template>
  <div
    v-if="modelValue?.length"
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

      <button
        v-if="isFilterCustomized"
        v-tippy="{ content: 'Сбросить источники' }"
        class="filter-item__button filter-item__button--reset"
        type="button"
        @click.left.exact.prevent="resetSources"
      >
        <svg-icon
          icon="close"
          size="24"
        />
      </button>
    </div>

    <div
      v-if="opened"
      class="filter-item__body"
    >
      <div
        v-for="(group, groupKey) in modelValue"
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

          <ui-checkbox
            v-tippy="{
              content: `${
                isGroupActive(groupKey) ? 'Выключить' : 'Включить'
              } «${group.name}»`,
            }"
            :model-value="isGroupActive(groupKey)"
            type="toggle"
            @update:model-value="setGroupStatus($event, groupKey)"
          />
        </div>

        <div class="filter-item__source-group_body">
          <ui-checkbox
            v-for="(checkbox, checkboxKey) in group.values"
            :key="checkboxKey"
            :model-value="checkbox.value"
            :tooltip="checkbox.tooltip"
            @update:model-value="setSourceValue($event, groupKey, checkboxKey)"
          >
            {{ checkbox.label }}
          </ui-checkbox>
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
        display: flex;
        align-items: center;
        cursor: default;

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
          background-color: var(--border);
          margin-left: 8px;
        }
      }

      &_body {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
    }
  }
</style>
