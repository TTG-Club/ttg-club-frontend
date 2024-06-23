<script setup lang="ts">
  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';
  import UiEraseButton from '@/shared/ui/kit/button/UiEraseButton.vue';

  const props = withDefaults(
    defineProps<{
      modelValue: string | number;
      label?: string;
      labelPosition?: 'left' | 'top';
      placeholder?: string;
      autofocus?: boolean;
      autocomplete?: boolean | 'on' | 'off';
      type?: 'text' | 'password' | 'email' | 'search' | 'tel' | 'number';
      isError?: boolean;
      isClearable?: boolean;
      min?: number;
      maxLength?: number;
      required?: boolean;
      errorText?: string;
    }>(),
    {
      label: '',
      labelPosition: 'top',
      placeholder: '',
      autofocus: false,
      autocomplete: 'off',
      type: 'text',
      isError: false,
      isClearable: false,
      min: undefined,
      maxLength: 255,
      required: false,
      errorText: '',
    },
  );

  defineEmits(['update:modelValue', 'blur']);

  defineOptions({
    inheritAttrs: false,
  });

  const showedPass = ref(false);
  const input = ref<HTMLInputElement>();
  const value = useVModel(props, 'modelValue');

  const inputType = computed(() => {
    if (props.type === 'password') {
      return showedPass.value ? 'text' : 'password';
    }

    return props.type;
  });

  const inputAutocomplete = computed(() => {
    switch (typeof props.autocomplete) {
      case 'boolean':
        return props.autocomplete ? 'on' : 'off';

      case 'string':
        return props.autocomplete;

      default:
        return 'off';
    }
  });

  const attrs = computed(() => {
    const attributes = { ...useAttrs() };

    if (props.type === 'number') {
      if (props.min !== undefined) {
        attributes.min = props.min;
      }
    }

    return attributes;
  });

  const focusInput = () => {
    if (input.value?.focus) {
      input.value.focus();
    }
  };

  const togglePass = () => {
    showedPass.value = !showedPass.value;

    focusInput();
  };

  const typeValidate = (e: KeyboardEvent) => {
    const isControlKey = e.key?.length > 1;
    const key = Number(e.key);
    const isNum = Number.isInteger(key);
    const { target } = e;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const isValueEmpty = target.value;

    if (props.type === 'number' && !isControlKey) {
      if (!isNum || (!isValueEmpty && !key)) {
        e.preventDefault();
      }
    }
  };

  onMounted(() => {
    if (props.autofocus) {
      focusInput();
    }
  });
</script>

<template>
  <label
    :class="{
      'ui-input': true,
      'is-vertical': labelPosition === 'top',
    }"
  >
    <span
      v-if="label"
      :class="{
        'ui-input__label': true,
        'is-top': labelPosition === 'top',
      }"
    >
      {{ label }}
    </span>

    <span
      :class="{ 'is-error': errorText }"
      class="ui-input__control"
    >
      <input
        ref="input"
        v-model="value"
        :autocomplete="inputAutocomplete"
        :placeholder="placeholder"
        :maxlength="maxLength"
        :spellcheck="false"
        :type="inputType"
        class="ui-input__input"
        v-bind="attrs"
        @keydown="typeValidate($event)"
        @blur="$emit('blur')"
      />

      <span
        v-if="type === 'password'"
        class="ui-input__control_icon"
        @click.left.exact.prevent="togglePass"
      >
        <svg-icon :icon="`password/${showedPass ? 'show' : 'hide'}`" />
      </span>

      <ui-erase-button
        v-if="isClearable && value"
        body-class="ui-input__erase-body"
        @click.stop.prevent="value = ''"
      />
    </span>

    <span
      v-if="!!errorText"
      class="ui-input__error"
    >
      {{ errorText }}
    </span>
  </label>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/mixins' as *;

  .ui-input {
    display: inline-flex;
    width: 100%;
    position: relative;

    &.is-vertical {
      flex-direction: column;
    }

    &__label {
      margin-bottom: 8px;
      display: block;

      &.is-top {
        padding: 0 8px;
      }
    }

    &__control {
      @include css_anim();

      border: 1px solid var(--border);
      background: var(--bg-sub-menu);
      border-radius: 8px;
      display: flex;
      overflow: hidden;
      width: 100%;

      &.is-error {
        border-color: var(--error);
      }

      &_icon {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 36px;
        width: 36px;
        cursor: pointer;
        padding: 10px;
        color: var(--text-color-title);
        font-size: 16px;
      }
    }

    & :deep(.ui-input__erase-body) {
      padding-top: 0;
      padding-bottom: 0;
    }

    &__input {
      width: 100%;
      background-color: transparent;
      color: var(--text-color);
      font-size: var(--main-font-size);
      height: 36px;
      font-family: 'Open Sans', serif;
      padding: 4px 12px;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      border: 0;
      flex: 1 1 auto;

      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      &[type='number'] {
        appearance: textfield; /* Firefox */
      }
    }

    &__error {
      color: var(--text-btn-color);
      font-size: calc(var(--main-font-size) - 2px);
      z-index: 1;
      padding: 0 6px;
      display: block;
      position: absolute;
      background-color: var(--error);
      border-radius: 4px;
      top: 32px;
      left: 8px;
    }

    &:focus-within {
      .ui-input {
        &__control {
          @include css_anim();

          border-color: var(--primary-active);
        }

        &__input {
          background-color: transparent;
        }
      }
    }

    &:hover {
      .ui-input {
        &__control {
          border-color: var(--primary-hover);
        }

        &__input {
          background-color: transparent;
        }
      }
    }
  }
</style>
