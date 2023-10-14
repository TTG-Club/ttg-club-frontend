<template>
  <div
    style="
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: bisque;
    "
  >
    <div
      class="ui-search"
      :class="{ focused }"
    >
      <input
        ref="input"
        v-model="searchText"
        :placeholder="placeholder"
        :disabled="disabled"
        class="ui-search__input"
        @focus="focused = true"
        @blur="focused = false"
      />

      <div class="ui-search__container">
        <span
          v-show="searchText.length > 0"
          class="ui-search__container--icon"
          @click="clearInput"
        >
          <svg-icon icon="close" />
        </span>

        <span
          class="ui-search__container--icon"
          @click="search"
        >
          <svg-icon icon="search" />
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';

  type Emit = {
    (e: 'handle:search', value: string): void;
  };

  const emit = defineEmits<Emit>();

  const props = withDefaults(
    defineProps<{
      disabled: boolean;
      placeholder: string;
    }>(),
    {
      disabled: false,
      placeholder: 'Placeholder'
    }
  );

  const { disabled, placeholder } = props;

  const searchText = ref<string>('');
  const focused = ref<boolean>(false);

  const clearInput = () => {
    searchText.value = '';
  };

  const search = () => {
    emit('handle:search', searchText.value);
  };
</script>

<style lang="scss" scoped>
  .ui-search.focused {
    border-color: var(--primary);
  }
  .ui-search.hovered {
    border-color: var(--text-color);
  }
  .ui-search {
    min-width: 230px;
    width: 280px;
    background-color: var(--bg-sub-menu);
    padding: 8px 8px;
    height: fit-content;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    gap: 8px;
    border-width: 1px;
    border-style: solid;
    border-color: var(--border);
    &:hover {
      border-color: var(--text-color);
    }
    @include media-min($md) {
      padding: 10px 12px;
      border-radius: 12px;
    }
    @include media-min($lg) {
      padding: 12px 16px;
      border-radius: 12px;
    }
    @include media-min($xl) {
      padding: 16px 16px;
      border-radius: 16px;
    }
    &__input {
      padding: 0;
      border: none;
      outline: none;
      background-color: inherit;
      color: var(--text-color);
      width: 100%;
      font-size: 14px;
      @include media-min($lg) {
        font-size: 16px;
      }
    }

    &__container {
      display: flex;
      align-items: center;
      &--icon {
        cursor: pointer;

        svg {
          width: 20px;
          height: 20px;
          @include media-min($md) {
            width: 24px;
            height: 24px;
          }
        }
      }
    }
  }
</style>
