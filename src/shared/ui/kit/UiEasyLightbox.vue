<script lang="ts">
  import VueEasyLightbox, { useEasyLightbox } from 'vue-easy-lightbox';

  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import type { PropType } from 'vue';

  export default defineComponent({
    components: {
      VueEasyLightbox,
      SvgIcon,
    },
    props: {
      images: {
        type: Array as PropType<string[]>,
        required: true,
        default: () => [],
      },
      preview: {
        type: String,
        default: null,
      },
      alt: {
        type: String,
        default: '',
      },
      useBgHide: {
        type: Boolean,
        default: true,
      },
    },
    setup(props) {
      const bgHide = ref(false);

      const {
        show,
        onHide,
        visibleRef: isShow,
        indexRef: index,
        imgsRef: imgs,
      } = useEasyLightbox({
        imgs: props.images,
      });

      const previewObj = computed(() => ({
        src: props.preview || props.images[0] || '/img/no-img.webp',
        error: '/img/no-img.webp',
      }));

      const isNoImages = computed(() => !props.images.length);

      const classes = computed(() => ({
        'ui-easy-lightbox': true,
        'is-disabled': isNoImages.value,
      }));

      const onToggleBg = () => {
        const modal = document.querySelector('.vel-modal');
        const className = 'is-bg-hide';

        bgHide.value = !bgHide.value;

        if (!modal) {
          return;
        }

        if (bgHide.value) {
          modal.classList.add(className);

          return;
        }

        modal.classList.remove(className);
      };

      const onShow = () => {
        if (isNoImages.value) {
          return;
        }

        show();
      };

      watchArray(
        () => props.images,
        (value) => {
          imgs.value = value;
          index.value = 0;
        },
        { flush: 'post' },
      );

      return {
        isNoImages,
        isShow,
        bgHide,
        index,
        imgs,
        previewObj,
        classes,

        onToggleBg,
        onShow,
        onHide,
      };
    },
  });
</script>

<template>
  <div
    :class="classes"
    @click.left.exact.prevent="onShow"
  >
    <div class="ui-easy-lightbox__container">
      <img
        v-lazy="previewObj"
        :alt="alt"
        class="ui-easy-lightbox__img"
      />
    </div>
  </div>

  <vue-easy-lightbox
    :imgs="imgs"
    :index="index"
    :visible="isShow"
    loop
    move-disabled
    scroll-disabled
    teleport="body"
    @hide="onHide"
  >
    <template #toolbar>
      <div class="vel-toolbar">
        <button
          v-if="useBgHide"
          aria-label="hide-bg button"
          class="toolbar-btn"
          type="button"
          @click.left.exact.prevent="onToggleBg"
        >
          <svg-icon
            :icon="`theme/${bgHide ? 'light' : 'dark'}`"
            class="vel-icon icon"
            size="24"
          />
        </button>
      </div>
    </template>
  </vue-easy-lightbox>
</template>

<style lang="scss" scoped>
  .ui-easy-lightbox {
    position: relative;
    width: 200px;
    height: 200px;
    float: right;
    margin: 0 0 32px 32px;
    cursor: pointer;

    &.is-disabled {
      cursor: default;
    }

    @media (max-width: 1400px) {
      width: 180px;
      height: 180px;
    }

    @media (max-width: 500px) {
      width: 120px;
      height: 120px;
      overflow: hidden;
      border-radius: 50%;
      margin: 0 0 16px 16px;
    }

    &__container {
      overflow: hidden;
      border-radius: 50%;
      height: auto;
      position: relative;
      height: 100%;
      width: 100%;
    }

    &__img {
      position: relative;
      left: 50%;
      top: 0;
      height: 100%;
      width: 100%;
      transform: translate(-50%, 0%);
      -o-object-fit: cover;
      object-fit: cover;
      display: grid;

      @media (max-width: 500px) {
        align-content: center;
      }
    }
  }
</style>

<style lang="scss">
  @use '@/assets/styles/variables/mixins' as *;

  .vel-modal {
    @include css_anim($item: background-color);
    z-index: 10000;

    &.is-bg-hide {
      background-color: var(--bg-main) !important;
    }

    .vel-img-wrapper {
      .vel-img {
        background-color: transparent;
        box-shadow: none;
      }
    }
  }
</style>
