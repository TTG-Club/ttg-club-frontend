<template>
  <vue-final-modal
    v-model="isShowModal"
    class="bookmark-remove-modal"
    content-transition="vfm-fade"
    esc-to-close
    focus-trap
    overlay-transition="vfm-fade"
    v-bind="$attrs"
  >
    <div class="bookmark-remove-modal__container">
      <div class="bookmark-remove-modal__header">
        <h1 class="bookmark-remove-modal__title">Удалить закладку</h1>
      </div>

      <div class="bookmark-remove-modal__wrapper">
        <h2 class="bookmark-remove-modal__wrapper-title">
          Вы действительно хотите удалить "{{ props.bookmarkName }}" ?
        </h2>

        <ui-checkbox
          v-model="dontAskAgainCheckbox"
          type="toggle"
        >
          Больше не спрашивать
        </ui-checkbox>

        <div class="bookmark-remove-modal__buttons">
          <ui-button
            type-outline
            @click.left.exact.prevent="confirm"
          >
            Да
          </ui-button>

          <ui-button
            type-outline
            @click.left.exact.prevent="close"
          >
            Отмена
          </ui-button>
        </div>
      </div>
    </div>
  </vue-final-modal>
</template>

<script lang="ts" setup>
  import { useVModel } from '@vueuse/core';
  import { ref, onBeforeMount } from 'vue';
  import { VueFinalModal } from 'vue-final-modal';

  import { useConfirmationRemoveBookmarkStore } from '@/features/bookmarks/store/ConfirmationRemoveBookmarkStore';
  import type { TBookmark } from '@/features/bookmarks/types/Bookmark';

  import UiButton from '@/shared/ui/kit/button/UiButton.vue';
  import UiCheckbox from '@/shared/ui/kit/UiCheckbox.vue';

  interface IEmits {
    (e: 'close'): void;
    (e: 'confirm'): void;
  }

  const emit = defineEmits<IEmits>();

  const props = withDefaults(
    defineProps<{
      modelValue: boolean;
      bookmarkName: TBookmark['name'];
    }>(),
    {
      bookmarkName: ''
    }
  );

  const confirmationModalStore = useConfirmationRemoveBookmarkStore();
  const isShowModal = useVModel(props, 'modelValue');
  const dontAskAgainCheckbox = ref(false);

  const close = () => {
    dontAskAgainCheckbox.value = false;
    isShowModal.value = false;
    emit('close');
  };

  const confirm = () => {
    confirmationModalStore.$patch({ dontAskAgain: dontAskAgainCheckbox.value });
    emit('confirm');
  };

  onBeforeMount(() => {
    const dontAskAgainPreference = confirmationModalStore.dontAskAgain;

    dontAskAgainCheckbox.value = dontAskAgainPreference;
  });
</script>

<style lang="scss" scoped>
  .bookmark-remove-modal {
    &__container {
      background-color: var(--bg-secondary);
      width: 100%;
      max-width: $sm - 1px;
      max-height: calc(var(--max-vh) - 56px * 2);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 22px 122px rgb(0 0 0 / 78%);
      display: flex;
      flex-direction: column;
      margin: 0 24px;
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

    &__wrapper {
      padding: 24px;
      &-title {
        color: var(--text-color-title);
        font-size: 16px;
        margin-right: auto;
      }
    }

    &__title {
      color: var(--text-color-title);
      font-size: 20px;
      line-height: 28px;
      margin-right: auto;
    }

    &__buttons {
      display: flex;
      flex-direction: row;
      justify-content: center;
      gap: 16px;
      .ui-button {
        width: 120px;
      }
    }

    .ui-checkbox {
      margin: 20px 0;
    }
  }
</style>
