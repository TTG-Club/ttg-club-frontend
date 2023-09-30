<template>
  <vue-final-modal
    v-model="isShowModal"
    class="dialog-modal"
    content-transition="vfm-fade"
    esc-to-close
    focus-trap
    overlay-transition="vfm-fade"
    v-bind="$attrs"
  >
    <div class="dialog-modal__container">
      <ui-button
        class="dialog-modal__close"
        icon="close"
        type="secondary"
        @click.left.exact.prevent="onClose"
      />

      <div
        v-if="$slots.title"
        class="dialog-modal__header"
      >
        <div class="dialog-modal__title">
          <slot name="title" />
        </div>
      </div>

      <div class="dialog-modal__content">
        <div class="dialog-modal__safe">
          <div class="dialog-modal__body">
            <slot
              name="content"
              @close="onClose"
            />
          </div>
        </div>
      </div>

      <div
        v-if="$slots.footer"
        class="dialog-modal__footer"
      >
        <slot
          name="footer"
          @close="onClose"
        />
      </div>

      <div class="dialog-modal__buttons">
        <ui-button
          type="secondary"
          @click.left.exact.prevent="onClose"
        >
          <slot name="cancelCaption" />
        </ui-button>

        <ui-button @click.left.exact.prevent="onConfirm">
          <slot name="confirmCaption" />
        </ui-button>
      </div>
    </div>
  </vue-final-modal>
</template>

<script lang="ts" setup>
  import { useVModel } from '@vueuse/core';
  import { VueFinalModal } from 'vue-final-modal';

  import UiButton from '@/shared/ui/kit/button/UiButton.vue';

  interface IEmits {
    (e: 'close'): void;
    (e: 'confirm'): void;
  }

  const props = withDefaults(
    defineProps<{
      modelValue: boolean;
      typeConfirm?: boolean;
      typeRemove?: boolean;
      typeNotify?: boolean;
      typeError?: boolean;
      bookmark?: any;
    }>(),
    {
      typeConfirm: false,
      typeRemove: false,
      typeNotify: false,
      typeError: false,
      bookmark: undefined
    }
  );

  const emit = defineEmits<IEmits>();

  const isShowModal = useVModel(props, 'modelValue');

  const onConfirm = () => {
    isShowModal.value = false;
    emit('confirm');
  };

  const onClose = () => {
    isShowModal.value = false;
    emit('close');
  };
</script>

<style lang="scss" scoped>
  .dialog-modal {
    &__container {
      background-color: var(--bg-secondary);
      width: 100%;
      max-width: $sm - 1px;
      min-height: 100px;
      max-height: calc(var(--max-vh) - 56px * 2);
      margin: auto;
      margin-inline: 16px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 22px 122px rgb(0 0 0 / 78%);
      display: flex;
      flex-direction: column;
      position: relative;

      @include media-max($md) {
        max-height: 100%;
      }
    }

    &__header {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding: 16px 16px 16px 24px;
      flex-shrink: 0;
      background-color: var(--hover);

      @media (max-width: 1200px) {
        padding: 12px 16px;
      }
    }

    &__title {
      color: var(--text-color-title);
      font-size: 22px;
      line-height: 28px;
      margin-right: auto;
    }

    &__bookmark {
      margin: {
        left: 16px;
        top: -6px;
        right: -6px;
        bottom: -6px;
      }
    }

    &__close {
      position: absolute;
      top: 12px;
      right: 12px;
    }

    &__content {
      overflow: auto;
      width: 100%;
      flex: 1;
      padding: 16px;
    }

    &__footer,
    &__buttons {
      padding: 16px;
      background-color: var(--bg-sub-menu);
    }

    &__buttons {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
  }
</style>
