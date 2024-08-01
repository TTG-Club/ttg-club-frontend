<script lang="ts" setup>
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  interface IEmits {
    (e: 'close'): void;
  }

  const props = withDefaults(
    defineProps<{
      modelValue?: boolean;
    }>(),
    {
      modelValue: true,
    },
  );

  const emit = defineEmits<IEmits>();

  const isShowModal = useVModel(props, 'modelValue');

  const onClose = () => {
    isShowModal.value = false;

    emit('close');
  };
</script>

<template>
  <n-modal
    v-model:show="isShowModal"
    @mask-click="onClose"
    @esc="onClose"
  >
    <div class="base-modal">
      <div class="base-modal__container">
        <div class="base-modal__header">
          <div class="base-modal__title">
            <slot name="title" />
          </div>

          <n-flex
            v-if="$slots.topButtons"
            size="small"
            class="base-modal__buttons_top"
          >
            <slot name="topButtons" />
          </n-flex>

          <n-button
            class="base-modal__close"
            secondary
            @click.left.exact.prevent="onClose"
          >
            <template #icon>
              <svg-icon icon="close" />
            </template>
          </n-button>
        </div>

        <div class="base-modal__content">
          <div class="base-modal__safe">
            <div class="base-modal__body">
              <slot @close="onClose" />
            </div>
          </div>
        </div>

        <div
          v-if="$slots.footer"
          class="base-modal__footer"
        >
          <slot
            name="footer"
            @close="onClose"
          />
        </div>
      </div>
    </div>
  </n-modal>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;

  .base-modal {
    &__container {
      overflow: hidden;
      display: flex;
      flex-direction: column;

      width: 100%;
      max-width: $lg - 1px;
      max-height: calc(var(--max-vh) - 56px * 2);
      margin: auto;

      background-color: var(--bg-secondary);
      border-radius: 8px;
      box-shadow: 0 22px 122px rgb(0 0 0 / 0.78);

      @include media-max($md) {
        max-height: 100%;
        border-radius: 0;
      }
    }

    &__header {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: flex-start;

      padding: 16px 16px 16px 24px;

      background-color: var(--hover);

      @media (width <= 1200px) {
        padding: 12px 16px;
      }
    }

    &__title {
      margin-right: auto;
      font-size: 22px;
      line-height: 28px;
      color: var(--text-color-title);
    }

    &__close {
      margin: {
        inset: -6px -6px -6px 16px;
      }
    }

    &__content {
      overflow: auto;
      flex: 1;
      width: 100%;
      padding-top: 16px;
    }

    &__footer {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;

      padding: 16px;

      background-color: var(--bg-sub-menu);

      > * + * {
        overflow: hidden;
        flex-shrink: 0;

        margin-left: 8px;

        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    &__controls {
      display: flex;
      flex-shrink: 0;
      gap: 8px;
      align-items: center;
      justify-content: flex-end;

      padding: 16px;

      background-color: var(--bg-sub-menu);
    }
  }
</style>
