<script setup lang="ts">
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  withDefaults(
    defineProps<{
      url: string;
      socialName: string;
      hideLabel?: boolean;
      transparent?: boolean;
    }>(),
    {
      hideLabel: false,
      transparent: false,
    },
  );
</script>

<template>
  <a
    :class="{
      [`is-${socialName}`]: true,
      'is-transparent': transparent,
    }"
    :href="url"
    class="ui-social-button"
    rel="noopener noreferrer"
    target="_blank"
  >
    <svg-icon
      :icon="socialName"
      :size="24"
    />

    <span
      v-if="!$slots.default && !hideLabel"
      class="ui-social-button__label"
    >
      {{ socialName }}
    </span>

    <span
      v-else-if="!hideLabel"
      class="ui-social-button__label"
    >
      <slot />
    </span>
  </a>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;
  @use '@/assets/styles/variables/mixins' as *;

  .ui-social-button {
    user-select: none;

    display: inline-flex;
    align-items: center;

    padding: 8px 16px;

    color: var(--text-btn-color);
    text-decoration: none;

    border-radius: 30px;

    @include css-anim($time: 0.2s);

    &__label {
      margin-left: 8px;
    }

    @include media-min($md) {
      &:hover {
        color: var(--text-btn-color);
      }
    }

    &.is-discord {
      background-color: var(--discord-base);

      @include media-min($md) {
        &:hover {
          background-color: var(--discord-hover);
        }
      }
    }

    &.is-patreon {
      background-color: var(--patreon-base);

      @include media-min($md) {
        &:hover {
          background-color: var(--patreon-hover);
        }
      }
    }

    &.is-vk {
      background-color: var(--vk-base);

      @include media-min($md) {
        &:hover {
          background-color: var(--vk-hover);
        }
      }
    }

    &.is-boosty {
      background-color: var(--boosty-base);

      @include media-min($md) {
        &:hover {
          background-color: var(--boosty-hover);
        }
      }
    }

    &.is-transparent {
      color: var(--text-color);
      background-color: transparent;

      @include media-min($md) {
        &:hover {
          opacity: 100%;
          background-color: var(--hover);
        }
      }
    }
  }
</style>
