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
      name: {
        type: String,
        default: '',
        required: true,
      },
      expand: {
        type: Boolean,
        default: false,
      },
      type: {
        type: String,
        default: 'crumb',
        validator: (value) => ['crumb', 'toggle'].includes(value),
      },
      modelValue: {
        type: Array,
        default: undefined,
      },
    },
    emits: ['update:model-value'],
    data: () => ({
      opened: false,
    }),
    computed: {
      isFilterCustomized() {
        if (!this.modelValue) {
          return false;
        }

        for (const value of this.modelValue) {
          if (value.value !== value.default) {
            return true;
          }
        }

        return false;
      },
    },
    beforeMount() {
      this.opened = this.isFilterCustomized || this.expand;
    },
    methods: {
      resetValues() {
        const values = cloneDeep(this.modelValue).map((value) => ({
          ...value,
          value: value.default,
        }));

        this.emitValues(values);
      },

      setValue(newValue, index) {
        const values = cloneDeep(this.modelValue);

        values[index].value = newValue;

        this.emitValues(values);
      },

      emitValues(values) {
        this.$emit('update:model-value', values);
      },

      toggleBlock() {
        this.opened = !this.opened;

        this.$refs.filterItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      },
    },
  };
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

      <button
        v-if="isFilterCustomized"
        v-tippy="{ content: `Сбросить блок «${name}»` }"
        class="filter-item__button filter-item__button--reset"
        type="button"
        @click.left.exact.prevent="resetValues"
      >
        <svg-icon
          icon="close"
          size="24"
        />
      </button>
    </div>

    <div
      v-if="opened"
      :class="{ 'is-toggle': type === 'toggle' }"
      class="filter-item__body"
    >
      <ui-checkbox
        v-for="(checkbox, checkboxKey) in modelValue"
        :key="checkboxKey"
        :model-value="checkbox.value"
        :tooltip="checkbox.tooltip"
        :type="type"
        @update:model-value="setValue($event, checkboxKey)"
      >
        {{ checkbox.label }}
      </ui-checkbox>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/modules/filter-item' as *;
</style>
