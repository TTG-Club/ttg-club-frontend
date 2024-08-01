<script setup lang="ts">
  import { useNavPopover } from '@/shared/composable/useNavPopover';

  const props = withDefaults(
    defineProps<{
      modelValue?: boolean;
      isMenu?: boolean;
      isLeft?: boolean;
      innerScroll?: boolean;
      bodyStyle?: any;
    }>(),
    {
      modelValue: false,
      isMenu: false,
      isLeft: false,
      innerScroll: false,
      bodyStyle: {},
    },
  );

  interface IEmit {
    (e: 'close'): void;
    (e: 'update:modelValue', v: typeof props.modelValue): void;
  }

  const emit = defineEmits<IEmit>();

  const isShow = useVModel(props, 'modelValue');
  const { isShowPopover } = useNavPopover();

  const classes = computed(() => ({
    'is-left': props.isLeft,
    'is-menu': props.isMenu,
    'inner-scroll': props.innerScroll,
  }));

  const onClose = () => {
    isShow.value = false;

    emit('close');
  };

  watch(isShow, (value) => {
    isShowPopover.value = value;
  });

  watch(isShowPopover, (value) => {
    if (!value && isShow.value) {
      isShow.value = false;
    }
  });
</script>

<template>
  <div class="nav-popover">
    <div
      :class="{ 'is-active': isShow }"
      class="nav-popover__trigger"
    >
      <slot
        :is-active="isShow"
        name="trigger"
      />
    </div>

    <transition name="fade">
      <div
        v-if="isShow"
        class="nav-popover__bg"
        @click.left.exact.self.prevent.stop="onClose"
      />
    </transition>

    <transition name="nav-popover-animation">
      <div
        v-if="isShow"
        :class="classes"
        class="nav-popover__body"
        :style="bodyStyle"
      >
        <slot
          :close="onClose"
          name="default"
        />
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;
  @use '@/assets/styles/variables/mixins' as *;

  .nav-popover {
    flex-shrink: 0;

    // position: relative; // Нужно будет включать, если нужно относительно кнопки позиционирование
    width: 40px;
    height: 40px;

    &__trigger {
      position: relative;
      width: 100%;
      height: 100%;
      font-size: 24px;

      &.is-active {
        z-index: 120;
      }
    }

    &__bg {
      cursor: pointer;

      position: fixed;
      z-index: 110;
      top: 0;
      left: 0;
      transform: translate3d(0, 0, 0);

      width: 100vw;
      height: var(--max-vh);

      background-color: var(--bg-light-main);
    }

    &__body {
      pointer-events: auto;
      cursor: auto;

      position: absolute;
      z-index: 111;
      top: inherit;
      right: 0;
      bottom: calc(64px + var(--safe-area-inset-bottom));
      left: 8px;
      transform-origin: bottom left;

      overflow: auto;
      display: inline-block;

      max-width: calc(100vw - 16px);
      max-height: calc(var(--max-vh) - 72px - var(--safe-area-inset-bottom));

      background-image: var(--bg-gradient);
      backdrop-filter: blur(16px);
      border-radius: 12px;
      box-shadow: 0 22px 122px rgb(0 0 0 / 0.78);

      @include media-min($md) {
        top: 16px;
        bottom: inherit;
        left: 64px;
        transform-origin: top left;

        width: fit-content;
        max-width: 1170px;
      }

      &.is-menu {
        width: calc(100vw - 16px);

        @include media-min($md) {
          width: calc(100vw - 56px - 24px);
        }
      }

      &.inner-scroll {
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
    }
  }

  .nav-popover-animation {
    &-enter-from,
    &-leave-to {
      z-index: -1;
      transform: scale(0) translate3d(0, 0, 0);
      opacity: 0;
    }

    &-enter-to,
    &-leave-from {
      z-index: 111;
      transform: scale(1) translate3d(0, 0, 0);
      opacity: 1;
    }

    &-enter-active,
    &-leave-active {
      @include css-anim(
        $time: 0.25s,
        $style: cubic-bezier(0.215, 0.61, 0.355, 1)
      );
    }
  }

  .navbar__header_right {
    .nav-popover {
      &__body {
        top: auto;
        right: 8px;
        bottom: 64px;
        left: initial;
        transform-origin: bottom right;

        width: auto;

        @include media-min($md) {
          top: auto;
          right: initial;
          bottom: 16px;
          left: 64px;
          transform-origin: bottom left;
        }
      }
    }
  }
</style>
