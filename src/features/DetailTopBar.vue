<script setup lang="ts">
  import type { TSource } from '@/shared/types/BaseApiFields';

  const props = withDefaults(
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

  const additionalTextSource = computed(
    () =>
      props.source?.group?.shortName === '3rd' ||
      props.source?.group?.shortName === 'HB',
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
          content: source.group!.name,
          touch: true,
        }"
        class="homebrew_text"
      >
        {{ source.group!.shortName }}
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
    flex-direction: column;
    gap: 12px;
    justify-content: space-between;

    margin: 0 16px;
    padding: 12px;

    background: var(--hover);
    border-radius: 8px;

    @include media-min($xl) {
      flex-direction: row;
      margin: 0 24px;
    }

    .left_info {
      flex: 1 1 100%;
      margin-right: 8px;
      font-style: italic;

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
