<template>
  <a
    :class="[`is-${socialName.toLowerCase()}`]"
    :href="url"
    class="ui-social-button"
    rel="noopener noreferrer"
    target="_blank"
  >
    <span class="ui-social-button__icon">
      <svg-icon :icon="socialName.toLowerCase()" />
    </span>

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

<script>
  import { defineComponent } from 'vue';

  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';

  export default defineComponent({
    components: { SvgIcon },
    props: {
      url: {
        type: String,
        required: true
      },
      socialName: {
        type: String,
        required: true
      },
      hideLabel: {
        type: Boolean,
        default: false
      }
    }
  });
</script>

<style lang="scss" scoped>
  .ui-social-button {
    @include css_anim($time: 0.2s);

    padding: 8px 16px;
    border-radius: 30px;
    display: inline-flex;
    align-items: center;
    text-decoration: none;
    color: var(--text-btn-color);
    user-select: none;

    &__icon {
      width: 24px;
      height: 24px;
    }

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
  }
</style>
