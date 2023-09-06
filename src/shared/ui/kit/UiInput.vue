<template>
  <label class="ui-input">
    <span
      v-if="label"
      class="ui-input__label"
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
        v-model="value"
        body-class="ui-input__erase-body"
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

<script setup>
  import { useVModel } from '@vueuse/core';
  import { computed, onMounted, ref, useAttrs } from 'vue';

  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';
  import UiEraseButton from '@/shared/ui/kit/button/UiEraseButton.vue';

  const props = defineProps({
    modelValue: {
      type: [String, Number],
      default: ''
    },
    label: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    autofocus: {
      type: Boolean,
      default: false
    },
    autocomplete: {
      type: [Boolean, String],
      default: false
    },
    type: {
      type: String,
      default: 'text'
    },
    isError: {
      type: Boolean,
      default: false
    },
    isClearable: {
      type: Boolean,
      default: false
    },
    min: {
      type: Number,
      default: undefined
    },
    maxLength: {
      type: Number,
      default: 255
    },
    required: {
      type: Boolean,
      default: false
    },
    errorText: {
      type: String,
      default: ''
    }
  });

  defineEmits(['update:modelValue', 'blur']);

  defineOptions({
    inheritAttrs: false
  });

  const showedPass = ref(false);
  const input = ref(null);
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

  const typeValidate = e => {
    const isControlKey = e.key.length > 1;
    const key = Number(e.key);
    const isNum = Number.isInteger(key);
    const isValueEmpty = e.target.value;

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

<style lang="scss" scoped>
  .ui-input {
    display: inline-flex;
    width: 100%;
    position: relative;

    &__label {
      margin-bottom: 8px;
      display: block;
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
