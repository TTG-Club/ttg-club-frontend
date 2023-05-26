<template>
  <div class="ui-select">
    <div
      v-if="$slots.label"
      class="ui-select__label"
    >
      <slot name="label" />
    </div>

    <multiselect
      v-bind="$props"
      @close="onClose"
      @open="onOpen"
      @remove="onRemove"
      @select="onSelect"
      @tag="onTag"
      @search-change="onSearch"
      @update:model-value="onUpdate"
    >
      <template #option="{ option, search }">
        <slot
          :option="option"
          :search="search"
          class="is-selected"
          name="option"
        />
      </template>

      <template #maxElements>
        <slot name="maxElements">
          Ты выбрал максимальное количество
        </slot>
      </template>

      <template #noResult>
        <slot name="noResult">
          Боги не знают ответа на твой запрос
        </slot>
      </template>

      <template #noOptions>
        <slot name="noOptions">
          Не всегда есть выбор
        </slot>
      </template>

      <template #beforeList>
        <slot name="beforeList" />
      </template>

      <template #afterList>
        <slot name="afterList" />
      </template>

      <template #caret="{ toggle }">
        <slot
          :toggle="toggle"
          name="caret"
        >
          <div
            class="multiselect__select"
            @mousedown.left.exact.prevent.stop="toggle()"
          >
            <svg-icon icon="arrow/down" />
          </div>
        </slot>
      </template>

      <template #singleLabel="{ option }">
        <div class="ui-select__slotted">
          <div
            v-if="$slots['left-slot']"
            class="ui-select__slotted--left"
          >
            <slot
              :option="option"
              name="left-slot"
            />
          </div>

          <div
            :class="{ 'is-wrap-disabled': isWrapDisabled }"
            class="ui-select__slotted--body"
          >
            <slot
              :option="option"
              name="singleLabel"
            >
              {{ getOptionLabel(option) }}
            </slot>
          </div>

          <div
            v-if="$slots['right-slot']"
            class="ui-select__slotted--right"
          >
            <slot
              :option="option"
              name="right-slot"
            />
          </div>
        </div>
      </template>

      <template #placeholder>
        <div class="ui-select__slotted">
          <div
            v-if="$slots['left-slot']"
            class="ui-select__slotted--left"
          >
            <slot name="left-slot" />
          </div>

          <div
            :class="{ 'is-wrap-disabled': isWrapDisabled }"
            class="ui-select__slotted--body"
          >
            <slot name="placeholder">
              Выбери что-нибудь
            </slot>
          </div>

          <div
            v-if="$slots['right-slot']"
            class="ui-select__slotted--right"
          >
            <slot name="right-slot" />
          </div>
        </div>
      </template>

      <template #limit>
        <slot name="limit">
          Ты выбрал слишком много
        </slot>
      </template>

      <template #clear="{ search }">
        <slot
          :search="search"
          name="clear"
        />
      </template>

      <template #tag="{ option, search, remove }">
        <slot
          :option="option"
          :remove="remove"
          :search="search"
          name="tag"
        />
      </template>
    </multiselect>
  </div>
</template>

<script>
  import Multiselect, { multiselectMixin } from 'vue-multiselect';
  import { defineComponent } from 'vue';
  import SvgIcon from '@/components/UI/icons/SvgIcon.vue';

  // TODO: Создать свой селект компонент
  export default defineComponent({
    components: {
      Multiselect,
      SvgIcon
    },
    mixins: [multiselectMixin],
    props: {
      ...Multiselect.props,
      name: {
        type: String,
        default: 'select'
      },
      placeholder: {
        type: String,
        default: ''
      },
      tagPlaceholder: {
        type: String,
        default: ''
      },
      searchable: {
        type: Boolean,
        default: false
      },
      required: {
        type: Boolean,
        default: false
      },
      iconBlock: {
        type: String,
        default: ''
      },
      allowEmpty: {
        type: Boolean,
        default: false
      },
      selectGroupLabel: {
        type: String,
        default: ''
      },
      selectLabel: {
        type: String,
        default: ''
      },
      selectedLabel: {
        type: String,
        default: ''
      },
      deselectLabel: {
        type: String,
        default: ''
      },
      deselectGroupLabel: {
        type: String,
        default: ''
      },
      disabled: {
        type: Boolean,
        default: false
      },
      isWrapDisabled: {
        type: Boolean,
        default: false
      }
    },
    emits: [
      'open',
      'search-change',
      'close',
      'select',
      'update:model-value',
      'remove',
      'tag'
    ],
    methods: {
      onUpdate(event) {
        this.$emit('update:model-value', event);
      },

      onSelect(event) {
        this.$emit('select', event);
      },

      onRemove(event) {
        this.$emit('remove', event);
      },

      onSearch(event) {
        this.$emit('search-change', event);
      },

      onTag(event) {
        this.$emit('tag', event);
      },

      onOpen(event) {
        this.$emit('open', event);
      },

      onClose(event) {
        this.$emit('close', event);
      }
    }
  });
</script>

<style lang="scss" scoped>
  :deep(.multiselect) {
    @include css_anim();

    box-sizing: border-box;
    outline: none;
    appearance: none;
    -webkit-overflow-scrolling: touch;
    display: flex;
    flex-direction: row-reverse;
    background: var(--bg-sub-menu);
    cursor: pointer;
    min-height: 38px;
    border: {
      width: 1px;
      style: solid;
      color: var(--border);
      radius: 8px;
    };

    .multiselect {
      &:after,
      &:before {
        box-sizing: border-box;
        outline: none;
        appearance: none;
        -webkit-overflow-scrolling: touch;
      }

      *,
      *:before,
      *:after {
        box-sizing: border-box;
        outline: none;
        appearance: none;
        -webkit-overflow-scrolling: touch;
      }

      &__tags {
        color: var(--text-color);
        font-size: var(--main-font-size);
        line-height: var(--main-line-height);
        background: transparent;
        min-height: 38px;
        width: 100%;
        padding: 0;
        border: 0;
        overflow: hidden;
        border-radius: 8px 0 0 8px;
      }

      &__select {
        @include css_anim();

        width: 38px;
        min-height: 100%;
        max-height: 100%;
        height: initial;
        padding: 7px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: static;
        flex-shrink: 0;
        top: initial;
        right: initial;
        border-radius: 0 8px 8px 0;

        &:hover {
          background-color: var(--hover);
        }

        &:before {
          display: none;
        }

        svg {
          @include css_anim();

          color: var(--primary);
        }
      }

      &__spinner {
        width: 38px;
        height: calc(100% - 2px);
        background: var(--bg-secondary);
        right: 0;

        &:before,
        &:after {
          border-color: var(--primary) transparent transparent;
        }
      }

      &__input {
        cursor: text;
        background: transparent;
        border: 0;
        height: 100%;
        margin: 0;
        padding: 8px;
        color: var(--text-color);
      }

      &__single,
      &__tags-wrap,
      &__placeholder {
        min-width: 38px;
        height: 100%;
        width: 100%;
        margin: 0;
        border-radius: 0;
        background: transparent;
        color: var(--text-color);
        font-size: var(--main-font-size);
        line-height: var(--main-line-height);

        &::placeholder {
          color: var(--text-color);
          font-size: var(--main-font-size);
          line-height: var(--main-line-height);
        }
      }

      &__single,
      &__placeholder {
        padding: 0;
      }

      &__tags-wrap {
        padding: 7px 12px 0 12px;
      }

      &__content {
        width: 100%;

        &-wrapper {
          background: var(--bg-secondary);
          color: var(--text-color);
          font-size: var(--main-font-size);
          line-height: var(--main-line-height);
          top: 100%;
          bottom: auto;
          left: -1px;
          width: calc(100% + 2px);
          border: {
            width: 0 1px 1px 1px;
            style: solid;
            color: var(--border);
            radius: 0 0 8px 8px;
          };
        }
      }

      &__option {
        color: var(--text-color);
        width: 100%;
        padding: 12px 12px 12px 28px;

        span {
          white-space: break-spaces;
          width: 100%;
          display: block;
        }

        &--group {
          background: var(--bg-sub-menu);
          color: var(--text-color);
          font-weight: 600;
        }

        &--disabled {
          background: var(--hover) !important;
        }

        &--highlight {
          background: var(--hover);
          color: var(--text-color);

          &:after {
            background: transparent;
          }
        }

        &--selected {
          font-weight: 400;
          color: var(--text-color-active);
          background: var(--hover);

          &.multiselect {
            &__option {
              &--highlight {
                color: var(--text-btn-color);
                background: var(--primary-hover);
              }
            }
          }
        }
      }

      &__element {
        width: 100%;
        margin-bottom: initial;
        line-height: initial;
      }

      &:hover,
      &:focus-within {
        @include css_anim();

        border-color: var(--primary-active);

        .multiselect {
          &__content {
            &-wrapper {
              border-color: var(--primary-active);
            }
          }
        }
      }
    }
  }

  :deep(.multiselect--active) {
    border-radius: 8px 8px 0 0;

    .multiselect {
      &__placeholder {
        display: inline-block;
      }

      &__select {
        border-radius: 0 8px 0 0;
        transform: none;

        svg {
          transform: rotate(-180deg);
        }
      }

      &__tags {
        border-radius: 8px 0 0 0;
      }
    }
  }

  .ui-select {
    &__label {
      margin-bottom: 8px;
      padding: 0 8px;
    }

    &__slotted {
      display: flex;
      height: 100%;
      min-height: 38px;

      &--left,
      &--right {
        padding: 8px;
        background-color: var(--primary);
        color: var(--text-btn-color);
        font-size: var(--main-font-size);
        line-height: calc(var(--main-line-height) + 1px);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-weight: 600;
        min-width: 38px;
      }

      &--body {
        padding: 8px;
        height: 100%;
        min-width: 38px;

        &.is-wrap-disabled {
          white-space: nowrap;
          width: 100%;
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }
</style>
