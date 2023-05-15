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
      >
        <slot
          :close="onClose"
          name="default"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
  import { computed, watch } from 'vue';
  import { useVModel } from '@vueuse/core';
  import { storeToRefs } from 'pinia';
  import { useNavStore } from '@/store/UI/NavStore';

  const props = withDefaults(defineProps<{
    modelValue?: boolean;
    isMenu?: boolean;
    isLeft?: boolean;
  }>(), {
    modelValue: false,
    isMenu: false,
    isLeft: false
  });

  const emit = defineEmits<{(e: 'close'): void; }>();

  const isShow = useVModel(props, 'modelValue');
  const navStore = useNavStore();
  const { isShowPopover } = storeToRefs(navStore);

  const classes = computed(() => ({
    'is-left': props.isLeft,
    'is-menu': props.isMenu
  }));

  const onClose = () => {
    isShow.value = false;

    emit('close');
  };

  watch(isShow, value => {
    isShowPopover.value = value;
  });

  watch(isShowPopover, value => {
    if (!value && isShow.value) {
      isShow.value = false;
    }
  });
</script>

<style lang="scss" scoped>
  .nav-popover {
    // position: relative; // Нужно будет включать, если нужно относительно кнопки позиционирование
    width: 40px;
    height: 40px;
    flex-shrink: 0;

    &__trigger {
      position: relative;
      width: 100%;
      height: 100%;

      &.is-active {
        z-index: 120;
      }
    }

    &__bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: var(--max-vh);
      background-color: var(--bg-light-main);
      transform: translate3d(0, 0, 0);
      z-index: 110;
      cursor: pointer;
    }

    &__body {
      pointer-events: auto;
      display: inline-block;
      cursor: auto;
      background-color: var(--bg-secondary);
      overflow: auto;
      border-radius: 8px;
      box-shadow: 0 22px 122px rgb(0 0 0 / 78%);
      transform-origin: bottom left;
      z-index: 111;
      position: absolute;
      top: inherit;
      bottom: calc(64px + var(--safe-area-inset-bottom));
      left: 8px;
      right: 0;
      max-width: calc(100vw - 16px);
      max-height: calc(var(--max-vh) - 72px - var(--safe-area-inset-bottom));

      @include media-min($md) {
        top: 16px;
        left: 64px;
        bottom: inherit;
        max-width: 1170px;
        width: fit-content;
        transform-origin: top left;
      }

      &.is-menu {
        width: calc(100vw - 16px);

        @include media-min($md) {
          width: calc(100vw - 56px - 24px);
        }
      }
    }
  }

  .nav-popover-animation {
    &-enter-from, &-leave-to {
      opacity: 0;
      transform: scale(0) translate3d(0, 0, 0);
      z-index: -1;
    }

    &-enter-to, &-leave-from {
      opacity: 1;
      transform: scale(1) translate3d(0, 0, 0);
      z-index: 111;
    }

    &-enter-active, &-leave-active {
      @include css_anim($time: .25s, $style: cubic-bezier(0.215, 0.61, 0.355, 1));
    }
  }

  .navbar__header_right {
    .nav-popover {
      &__body {
        top: auto;
        left: 8px;
        right: 8px;
        bottom: 64px;
        width: auto;
        transform-origin: bottom right;

        @include media-min($md) {
          top: auto;
          left: 64px;
          right: initial;
          bottom: 16px;
          transform-origin: bottom left;
        }
      }
    }
  }
</style>
