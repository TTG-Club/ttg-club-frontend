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
      background-color: var(--bg-secondary);
      width: 100%;
      max-width: $lg - 1px;
      max-height: calc(var(--max-vh) - 56px * 2);
      margin: auto;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 22px 122px rgb(0 0 0 / 78%);
      display: flex;
      flex-direction: column;

      @include media-max($md) {
        border-radius: 0;
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

    &__close {
      margin: {
        left: 16px;
        top: -6px;
        right: -6px;
        bottom: -6px;
      }
    }

    &__content {
      overflow: auto;
      width: 100%;
      flex: 1;
      padding-top: 16px;
    }

    &__footer {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px;
      flex-shrink: 0;
      background-color: var(--bg-sub-menu);

      > * + * {
        margin-left: 8px;
        flex-shrink: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    &__controls {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      padding: 16px;
      flex-shrink: 0;
      background-color: var(--bg-sub-menu);
    }
  }
</style>
