<script setup lang="ts">
  import type { TSource } from '@/shared/types/BaseApiFields';

  defineOptions({
    computed: {
      additionalTextSource() {
        return (
          this.source.group.shortName === '3rd' ||
          this.source.group.shortName === 'HB'
        );
      },
    },
  });

  withDefaults(
    defineProps<{
      left?: string;
      source?: TSource;
      bgGrey?: boolean;
    }>(),
    {
      left: '',
      source: undefined,
      bgGrey: true,
    },
  );
</script>

<template>
  <div
    :class="{ bg_grey: bgGrey }"
    class="row_info"
  >
    <span
      v-if="left"
      class="left_info"
    >
      {{ left }}
    </span>

    <span
      v-else-if="!!$slots.left"
      class="left_info"
    >
      <slot name="left" />
    </span>

    <span
      v-if="source"
      class="right_info"
    >
      Источник:

      <span
        v-if="additionalTextSource"
        v-tippy-lazy="{
          content: source.group.name,
          touch: true,
        }"
        class="homebrew_text"
      >
        {{ source.group.shortName }}
      </span>

      <span v-tippy="{ content: source.name, touch: true }"
        >&nbsp;{{ source.shortName }}</span
      >
    </span>

    <span
      v-else-if="$slots.default"
      class="right_info"
    >
      <slot />
    </span>
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;

  .row_info {
    display: flex;
    padding: 12px;
    flex-direction: column;
    justify-content: space-between;
    border-radius: 8px;
    margin: 0 16px;
    gap: 12px;
    background: var(--hover);

    @include media-min($xl) {
      flex-direction: row;
      margin: 0 24px;
    }

    .left_info {
      font-style: italic;
      margin-right: 8px;
      flex: 1 1 100%;

      @include media-min($xl) {
        margin-right: 0;
      }
    }

    .right_info {
      flex-shrink: 0;
    }

    &.bg_grey {
      background: var(--hover);
    }
  }
</style>
