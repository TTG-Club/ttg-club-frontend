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

<script>
  import { computed, defineComponent } from 'vue';
  import SocialLinks from '@/components/content/SocialLinks.vue';
  import { useDayjs } from '@/common/composition/useDayjs';
  import { useUIStore } from '@/store/UI/UIStore';

  export default defineComponent({
    components: { SocialLinks },
    props: {
      useSocialLinks: {
        type: Boolean,
        default: true
      },
      dateTime: {
        type: String,
        default: ''
      },
      showSeparator: {
        type: Boolean,
        default: true
      }
    },
    setup(props) {
      const uiStore = useUIStore();
      const dayjs = useDayjs();

      const dateTimeFormatted = computed(() => {
        const datetime = dayjs(props.dateTime);

        if (!datetime.isValid()) {
          return '';
        }

        return datetime.format('LL');
      });

      return {
        dateTimeFormatted,
        isMobile: computed(() => uiStore.isMobile)
      };
    }
  });
</script>

<style lang="scss" scoped>
  .page-layout {
    display: flex;
    min-height: var(--max-vh);

    &__side {
      &--left {
        flex: 1 0 10%;
      }

      &--center {
        flex: 1 1 620px;
        max-width: 100%;
        margin: 0 auto;
        border-radius: 12px;
        display: flex;
        flex-direction: column;

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
      padding: 32px 0 16px 0;
      margin-bottom: 16px;

      &.show-separator {
        border-bottom: 1px solid var(--border);
      }

      @media (max-width: 600px) {
        padding: 16px 0 16px 0;
      }
    }

    &__title {
      font-weight: 500;
      font-family: "Lora";
      margin: 0;
    }

    &__subtitle {
      line-height: normal;
      margin: 16px 0 0;

      @media (max-width: 600px) {
        font-size: calc(var(--h4-font-size) - 2px);
      }
    }

    &__date {

    }

    &__content {
      padding-bottom: 24px;
      flex: 1 1 auto;
    }

    &__socials {
      margin: 16px 0 40px;
    }
  }
</style>
