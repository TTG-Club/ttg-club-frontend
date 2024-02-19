<script lang="ts" setup>
  import { useVModel } from '@vueuse/core';
  import { VueFinalModal } from 'vue-final-modal';

  import UiButton from '@/shared/ui/kit/button/UiButton.vue';

  interface IEmit {
    (e: 'close'): void;
  }

  const props = withDefaults(
    defineProps<{
      modelValue: boolean;
      title?: string;
    }>(),
    {
      title: '',
    },
  );

  const emit = defineEmits<IEmit>();

  const isShowModal = useVModel(props, 'modelValue');

  const onClose = () => {
    isShowModal.value = false;

    emit('close');
  };
</script>

<template>
  <vue-final-modal
    v-model="isShowModal"
    class="auth-reg-modal"
    content-transition="vfm-fade"
    esc-to-close
    focus-trap
    overlay-transition="vfm-fade"
    v-bind="$attrs"
  >
    <div class="auth-reg-modal__container">
      <img
        :alt="title"
        class="auth-reg-modal__bg"
        src="/img/bg_login.png"
      />

      <div class="auth-reg-modal__content">
        <ui-button
          class="auth-reg-modal__close"
          icon="close"
          type="secondary"
          @click.left.exact.prevent="onClose"
        />

        <div class="auth-reg-modal__body">
          <h4>{{ title }}</h4>

          <div class="auth-reg-modal__form">
            <slot
              name="default"
              @close="onClose"
            />
          </div>
        </div>
      </div>
    </div>
  </vue-final-modal>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;
  @use '@/assets/styles/variables/mixins' as *;

  .auth-reg-modal {
    &__container {
      background-color: var(--bg-secondary);
      max-height: calc(var(--max-vh) / 100 * 90);
      margin: auto;
      overflow: hidden;
      box-shadow: 0 22px 122px rgb(0 0 0 / 78%);
      display: flex;
      width: 100%;
      max-width: 700px;

      @include media-min($sm) {
        border-radius: 8px;
      }
    }

    &__bg {
      width: 240px;
      object-fit: cover;
      display: none;

      @include media-min($md) {
        display: block;
      }
    }

    &__content {
      flex: 1 1 100%;
      max-height: var(--max-vh);
      padding: 16px;
      position: relative;
      overflow: auto;

      @include media-min($md) {
        padding: 48px;
      }
    }

    &__header {
      width: 100%;
      display: flex;
      justify-content: flex-end;
    }

    &__close {
      @include css_anim();

      position: absolute;
      top: 12px;
      right: 12px;
    }

    &__body {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;

      h4 {
        margin: 0;
        pointer-events: none;
      }
    }

    &__form {
      margin-top: 24px;
    }
  }
</style>
