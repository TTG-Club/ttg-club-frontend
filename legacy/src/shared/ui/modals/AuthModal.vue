<script lang="ts" setup>
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

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
  <n-modal v-model:show="isShowModal">
    <div class="auth-reg-modal">
      <div class="auth-reg-modal__container">
        <img
          :alt="title"
          class="auth-reg-modal__bg"
          src="/img/bg_login.png"
        />

        <div class="auth-reg-modal__content">
          <n-button
            class="auth-reg-modal__close"
            secondary
            @click.left.exact.prevent="onClose"
          >
            <template #icon>
              <svg-icon icon="close" />
            </template>
          </n-button>

          <div class="auth-reg-modal__body">
            <h4>
              {{ title }}
            </h4>

            <div class="auth-reg-modal__form">
              <transition
                name="fade"
                mode="out-in"
              >
                <slot
                  name="default"
                  @close="onClose"
                />
              </transition>
            </div>
          </div>
        </div>
      </div>
    </div>
  </n-modal>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;
  @use '@/assets/styles/variables/mixins' as *;

  .auth-reg-modal {
    width: 100%;
    max-width: 698px;

    &__container {
      overflow: hidden;
      display: flex;

      max-height: calc(var(--max-vh) / 100 * 90);

      background-color: var(--bg-secondary);
      box-shadow: var(--n-box-shadow);

      @include media-min($sm) {
        border-radius: 8px;
      }

      @include media-min($md) {
        min-height: 454px;
      }
    }

    &__bg {
      display: none;
      width: 240px;
      object-fit: cover;

      @include media-min($md) {
        display: block;
      }
    }

    &__content {
      position: relative;

      overflow: auto;
      flex: 1 1 100%;

      max-height: var(--max-vh);
      padding: 16px;

      @include media-min($md) {
        padding: 48px;
      }
    }

    &__header {
      display: flex;
      justify-content: flex-end;
      width: 100%;
    }

    &__close {
      position: absolute;
      top: 12px;
      right: 12px;
    }

    &__body {
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 100%;

      h4 {
        pointer-events: none;
        margin: 0;
      }
    }

    &__form {
      margin-top: 24px;
    }
  }
</style>
