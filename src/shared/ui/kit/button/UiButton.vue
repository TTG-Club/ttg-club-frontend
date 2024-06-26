<script setup lang="ts">
  import { onClickOutside } from '@vueuse/core';
  import { computed, inject, ref, useSlots, watch } from 'vue';
  import { useTippy } from 'vue-tippy';

  import IconLoader from '@/shared/ui/icons/IconLoader.vue';
  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';
  import type {
    TButtonType,
    TButtonOption,
    ISharedButtonProps,
    TButtonIconPosition,
  } from '@/shared/ui/kit/button/UiButton';
  import { buttonGroupContextKey } from '@/shared/ui/kit/button/UiButton.const';

  import type { Events } from 'vue';
  import type { TippyOptions } from 'vue-tippy';

  interface IProps extends ISharedButtonProps {
    type?: TButtonType;
    iconPosition?: TButtonIconPosition;
    icon?: string;
    loading?: boolean;
    split?: boolean;
    tooltip?: TippyOptions;
    options?: Array<TButtonOption>;
    bodyClass?: string;
    beforeDropdownShow?: () => void;
    beforeDropdownHide?: () => void;
  }

  interface IEmit {
    (e: 'click', v: Events['onClick']): void;
    (e: 'dropdown-show'): void;
    (e: 'dropdown-hide'): void;
  }

  const emit = defineEmits<IEmit>();

  const props = withDefaults(defineProps<IProps>(), {
    bodyClass: undefined,
    type: 'default',
    size: 'md',
    color: 'primary',
    iconPosition: 'left',
    icon: undefined,
    disabled: false,
    loading: false,
    fullWidth: false,
    nativeType: 'button',
    split: false,
    tooltip: undefined,
    options: () => [],
    beforeDropdownShow: undefined,
    beforeDropdownHide: undefined,
  });

  const button = ref<Element>();

  if (props.tooltip) {
    useTippy(button, props.tooltip);
  }

  const slots = useSlots();

  const groupContext = inject(buttonGroupContextKey, undefined);

  const buttonType = computed(
    () => groupContext?.type || props.type || 'default',
  );

  const buttonColor = computed(() =>
    props.color !== 'text'
      ? `var(--btn-${groupContext?.color || props.color || 'primary'})`
      : 'currentColor',
  );

  const buttonHoverColor = computed(() =>
    props.color !== 'text'
      ? `var(--btn-${groupContext?.color || props.color || 'primary'}-hover)`
      : 'currentColor',
  );

  const buttonSize = computed(() => groupContext?.size || props.size || 'md');

  const isDisabled = computed(
    () => groupContext?.disabled || props.disabled || props.loading,
  );

  const hasDropdown = computed(
    () => !!slots.dropdown || !!props.options.length,
  );

  const isDropdownShow = ref(false);
  const dropdownTrigger = ref<HTMLButtonElement | null>(null);
  const dropdown = ref<HTMLElement | null>(null);

  const onDropdownShow = async () => {
    if (isDisabled.value) {
      return;
    }

    if (props.beforeDropdownShow) {
      try {
        await props.beforeDropdownShow();

        isDropdownShow.value = true;
      } catch (err) {
        isDropdownShow.value = false;

        console.error(err);
      }

      return;
    }

    isDropdownShow.value = true;
  };

  const onDropdownHide = async () => {
    if (props.beforeDropdownHide) {
      try {
        await props.beforeDropdownHide();
      } catch (err) {
        console.error(err);
      } finally {
        isDropdownShow.value = false;
      }

      return;
    }

    isDropdownShow.value = false;
  };

  const toggleDropdown = () =>
    isDropdownShow.value ? onDropdownHide() : onDropdownShow();

  const onClick = async (e: Events['onClick']) => {
    if (isDisabled.value) {
      return;
    }

    if (!props.split && slots.dropdown) {
      await toggleDropdown();

      return;
    }

    emit('click', e);
  };

  onClickOutside(dropdown, onDropdownHide, {
    ignore: [dropdownTrigger],
  });

  watch(isDropdownShow, (value) => {
    if (value) {
      emit('dropdown-show');

      return;
    }

    emit('dropdown-hide');
  });
</script>

<template>
  <span
    :class="{
      'ui-button': true,
      [$style['ui-button']]: true,
      [$style['is-full-width']]: fullWidth,
      [$style['is-disabled']]: isDisabled,
    }"
    @click.prevent.stop
  >
    <button
      ref="button"
      :class="{
        [props.bodyClass]: !!props.bodyClass,
        [$style.body]: true,
        [$style.main]: true,
        [$style[`type-${buttonType}`]]: true,
        [$style[`size-${buttonSize}`]]: true,
        [$style[`icon-${iconPosition}`]]: true,
        [$style['with-split']]: split && hasDropdown,
        [$style['no-text']]: !$slots.default,
        [$style['is-disabled']]: isDisabled,
      }"
      :type="nativeType"
      :disabled="isDisabled"
      :aria-disabled="isDisabled"
      @click.stop="onClick"
    >
      <span
        v-if="!isDisabled"
        :class="$style.hover"
      />

      <span
        v-if="loading"
        :class="$style.icon"
      >
        <icon-loader />
      </span>

      <span
        v-else-if="icon || !!$slots.icon"
        :class="$style.icon"
      >
        <svg-icon
          v-if="icon"
          :icon="icon"
          size="1em"
        />

        <slot
          v-else
          name="icon"
        />
      </span>

      <span
        v-if="$slots.default"
        :class="$style.text"
      >
        <slot name="default" />
      </span>

      <span
        v-if="!split && $slots.dropdown"
        :class="$style.icon"
      >
        <svg-icon
          icon="arrow/filled/down-mini"
          size="1em"
        />
      </span>

      <span
        v-if="isDisabled"
        :class="$style.disabled"
      />
    </button>

    <button
      v-if="split && hasDropdown"
      ref="dropdownTrigger"
      type="button"
      :class="{
        [$style.body]: true,
        [$style.split]: true,
        [$style[`type-${buttonType}`]]: true,
        [$style[`size-${buttonSize}`]]: true,
        [$style['is-disabled']]: isDisabled,
      }"
      :aria-disabled="isDisabled"
      :disabled="isDisabled"
      @click.left.exact.prevent.stop="toggleDropdown"
    >
      <span
        v-if="!isDisabled"
        :class="$style.hover"
      />

      <span :class="$style.icon">
        <svg-icon icon="arrow/down" />
      </span>

      <span
        v-if="isDisabled"
        :class="$style.disabled"
      />
    </button>

    <transition
      name="fade"
      mode="out-in"
    >
      <span
        v-if="$slots.dropdown && isDropdownShow"
        ref="dropdown"
        :class="$style.dropdown"
      >
        <slot name="dropdown" />
      </span>

      <span
        v-else-if="!!options.length && isDropdownShow"
        ref="dropdown"
        :class="$style.dropdown"
      >
        <span
          v-for="option in options"
          :key="option.key"
          :class="$style.option"
          @click.left.exact.prevent="option.callback(option.key)"
          @dblclick.prevent.stop
        >
          {{ option.label }}
        </span>
      </span>
    </transition>
  </span>
</template>

<style lang="scss" module>
  @use '@/assets/styles/variables/mixins' as *;

  $radius: 8px;

  html {
    --btn-primary: var(--primary);
    --btn-primary-hover: var(--primary-hover);
    --btn-success: var(--success);
    --btn-success-hover: var(--success-hover);
    --btn-error: var(--error);
    --btn-error-hover: var(--error-hover);
    --btn-warning: var(--warning);
    --btn-warning-hover: var(--warning-hover);
    --btn-info: var(--info);
    --btn-info-hover: var(--info-hover);
  }

  .ui-button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    flex-shrink: 0;
    pointer-events: none;

    > * {
      pointer-events: auto;
    }

    & + & {
      margin-left: 8px;
    }

    &.is-full-width {
      width: 100%;
    }
  }

  .body {
    $items: background-color, border-color;

    @include css_anim($item: $items);

    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    gap: 8px;
    color: var(--text-btn-color);
    overflow: hidden;
    margin: 0;
    position: relative;
    border: {
      radius: $radius;
      width: 1px;
      style: solid;
      color: var(--border);
    }

    &.icon {
      &-left {
        flex-direction: row;
      }

      &-right {
        flex-direction: row-reverse;
      }
    }

    &.size {
      &-md {
        font-size: 14px;
        line-height: 18px;
      }
    }

    &.type {
      &-default {
        background-color: v-bind(buttonColor);
        padding: 10px;
        border: {
          width: 0;
        }

        &.size-sm {
          padding: 7px;
        }
      }

      &-secondary {
        background-color: var(--bg-secondary);
        color: var(--text-b-color);
        padding: 9px;

        &.size-sm {
          padding: 6px;
        }
      }

      &-outline {
        background-color: transparent;
        padding: 9px;

        &.size-sm {
          padding: 6px;
        }
      }

      &-text,
      &-plain {
        background-color: transparent;
        color: v-bind(buttonColor);
        padding: 10px;
        border: {
          width: 0;
        }

        &.size-sm {
          padding: 7px;
        }
      }

      &-plain {
        &:hover {
          color: v-bind(buttonHoverColor);

          .hover {
            display: none;
          }
        }
      }
    }

    &:hover {
      .hover {
        opacity: 15%;
      }
    }
  }

  .main {
    flex: 1 1 auto;

    &.with-split {
      border: {
        right-width: 0;
        top-right-radius: 0;
        bottom-right-radius: 0;
      }

      &.no-text {
        &.type {
          &-default,
          &-text,
          &-plain {
            padding: 10px 6px 10px 7px;

            &.size-sm {
              padding: 7px 6px 7px 7px;
            }
          }

          &-secondary,
          &-outline {
            padding: 9px 6px 9px 7px;

            &.size-sm {
              padding: 6px 6px 6px 7px;
            }
          }
        }
      }
    }
  }

  .split {
    border: {
      left-width: 0;
      top-left-radius: 0;
      bottom-left-radius: 0;
    }

    &.type {
      &-default,
      &-text,
      &-plain {
        padding: 10px 5px 10px 4px;
      }

      &-secondary,
      &-outline {
        padding: 9px 5px 9px 4px;
      }
    }
  }

  .disabled,
  .hover {
    @include css_anim();

    content: '';
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .hover {
    background-color: black;
    opacity: 0;
    z-index: 1;
  }

  .text,
  .icon {
    position: relative;
    z-index: 2;
  }

  .text {
    overflow: hidden;
    display: inline-block;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: normal;
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 24px;
    margin: -3px;
    @include css_anim($item: color);
  }

  .disabled {
    z-index: 3;
    background-color: white;
    opacity: 20%;
    cursor: not-allowed;
  }

  .dropdown {
    position: absolute;
    background-color: var(--bg-sub-menu);
    padding: 8px;
    border-radius: 6px;
    box-shadow: 0 5px 30px #00000038;
    top: calc(100% + 4px);
    right: 0;
    z-index: 1;
    max-height: calc(16px + 30px * 4); // TODO: fix (padding + 4 elements)
    overflow: auto;
  }

  .option {
    padding: 6px 6px;
    border-radius: 6px;
    cursor: pointer;
    min-width: 100px;
    max-width: 260px;
    white-space: nowrap;
    overflow: hidden;
    width: 100%;
    text-overflow: ellipsis;
    line-height: 18px;
    font-size: 14px;
    display: block;

    &:hover {
      background-color: var(--hover);
    }

    & + & {
      margin-top: 4px;
    }
  }
</style>
