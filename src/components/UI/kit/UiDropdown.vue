<template>
  <div class="ui-select">
    <div
      v-if="$slots.label"
      class="ui-select__label"
    >
      <slot name="label" />
    </div>

    <div
      class="ui-select__wrapper"
      @focusin="toggleFocus"
      @focusout="toggleFocus"
    >
      <ui-input
        ref="input"
        v-model="selectedOption"
        :placeholder="togglePlaceholder"
      />

      <div
        class="ui-select__select"
        @click="toggleFocus"
      >
        <svg-icon :icon="toggleIcon" />
      </div>
    </div>

    <div
      v-if="focused"
      class="ui-select"
    >
      <div
        v-for="option in options"
        :key="option.url"
      >
        {{ option.name.rus }}
        <br>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    computed, ref
  } from "vue";
  import UiInput from "@/components/UI/kit/UiInput.vue";

  const props = defineProps({
    placeholder: {
      type: String,
      default: ''
    },
    options: {
      type: Array,
      default: () => []
    }
  });

  const input = ref(null);
  const selectedOption = ref<String>('');
  const focused = ref<Boolean>(false);

  const toggleFocus = e => {
    if (e.type === "focusin") {
      focused.value = true;
      console.log(input);
    }

    if (e.type === "focusout") {
      focused.value = false;
    }

    if (e.type === "click") {
      focused.value = !focused.value;
    }
  };

  const togglePlaceholder = computed(() => (focused.value ? '' : props.placeholder));

  const toggleIcon = computed(() => (focused.value ? "arrow/up" : "arrow/down"));
</script>

<style lang="scss" scoped>
.ui-select {
  &__label {
    margin-bottom: 8px;
    padding: 0 8px;
  }

  &__select {
    @include css_anim();

    width: 38px;
    min-height: 100%;
    max-height: 100%;
    height: initial;
    padding: 11px;
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

  &__wrapper {
    @include css_anim();

    box-sizing: border-box;
    outline: none;
    appearance: none;
    -webkit-overflow-scrolling: touch;
    display: flex;
    flex-direction: row;
    background: var(--bg-sub-menu);
    cursor: pointer;
    min-height: 38px;
    border: {
      width: 1px;
      style: solid;
      color: var(--border);
      radius: 8px;
    };
  }
}

:deep(.ui-input__input) {
  color: var(--text-color-active);
  cursor: pointer;
}

:deep(.ui-input__control) {
  border: none;
}
</style>
