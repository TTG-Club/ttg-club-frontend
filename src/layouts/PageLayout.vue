<script setup lang="ts">
  import dayjs from 'dayjs';

  import { useUIStore } from '@/shared/stores/UIStore';
  import SocialLinks from '@/shared/ui/SocialLinks.vue';

  const props = withDefaults(
    defineProps<{
      useSocialLinks?: boolean;
      showSeparator?: boolean;
      dateTime?: string;
    }>(),
    {
      useSocialLinks: false,
      showSeparator: false,
      dateTime: undefined,
    },
  );

  const { isMobile } = storeToRefs(useUIStore());

  const dateTimeFormatted = computed(() => {
    if (!props.dateTime) {
      return '';
    }

    const datetime = dayjs(props.dateTime);

    if (!datetime.isValid()) {
      return '';
    }

    return datetime.format('LL');
  });
</script>

<template>
  <div class="page-layout">
    <div
      v-if="$slots.left && !isMobile"
      class="page-layout__side--left"
    >
      <slot name="left" />
    </div>

    <div class="page-layout__side--center">
      <div
        v-if="$slots.title || $slots.subtitle"
        :class="{ 'show-separator': showSeparator }"
        class="page-layout__header"
      >
        <h1
          v-if="$slots.title"
          class="page-layout__title"
        >
          <slot name="title" />
        </h1>

        <h4
          v-if="$slots.subtitle"
          class="page-layout__subtitle"
        >
          <slot name="subtitle" />
        </h4>

        <h5
          v-if="dateTimeFormatted"
          class="page-layout__date"
        >
          <time :datetime="dateTime">{{ dateTimeFormatted }}</time>
        </h5>
      </div>

      <div class="page-layout__content">
        <slot />
      </div>

      <div
        v-if="useSocialLinks"
        class="page-layout__socials"
      >
        <social-links />
      </div>
    </div>

    <div
      v-if="$slots.right && !isMobile"
      class="page-layout__side--right"
    >
      <slot name="right" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;

  .page-layout {
    display: flex;
    min-height: 100%;

    &__side {
      &--left {
        flex: 1 0 10%;
      }

      &--center {
        display: flex;
        flex: 1 1 620px;
        flex-direction: column;

        max-width: 100%;
        margin: 0 auto;

        border-radius: 12px;

        @include media-min($xl) {
          flex: 1 1 960px;
          max-width: 960px;
        }
      }

      &--right {
        flex: 1 0 10%;
      }
    }

    &__header {
      margin-bottom: 16px;
      padding: 32px 0 16px;

      &.show-separator {
        border-bottom: 1px solid var(--border);
      }

      @media (width <= 600px) {
        padding: 16px 0;
      }
    }

    &__title {
      margin: 0;
      font-family: Lora, serif;
      font-weight: 500;
    }

    &__subtitle {
      margin: 16px 0 0;
      line-height: normal;

      @media (width <= 600px) {
        font-size: calc(var(--h4-font-size) - 2px);
      }
    }

    &__content {
      flex: 1 1 auto;
      padding-bottom: 24px;
    }

    &__socials {
      margin: 16px 0 40px;
    }
  }
</style>
