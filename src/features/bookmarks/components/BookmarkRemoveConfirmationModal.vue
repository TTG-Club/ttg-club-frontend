<script lang="ts" setup>
  import localforage from 'localforage';
  import { ref } from 'vue';
  import { VueFinalModal } from 'vue-final-modal';

  import { DB_NAME } from '@/shared/constants/UI';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';
  import UiCheckbox from '@/shared/ui/kit/UiCheckbox.vue';

  import type { TBookmark } from '@/features/bookmarks/types/Bookmark';

  interface IEmits {
    (e: 'close'): void;
    (e: 'confirm'): void;
  }

  defineProps<{
    bookmark: TBookmark;
  }>();

  const emit = defineEmits<IEmits>();

  const storage = localforage.createInstance({
    name: DB_NAME,
    storeName: 'bookmarks',
  });

  const dontAsk = ref(false);

  const updateStorageDontAsk = async () => {
    if (dontAsk.value) {
      await storage.ready();

      await storage.setItem('dont_ask_again', true);
    }
  };

  const close = () => {
    emit('close');
  };

  const confirm = async () => {
    await updateStorageDontAsk();

    emit('confirm');
  };
</script>

<template>
  <vue-final-modal
    class="base-modal"
    content-transition="vfm-fade"
    esc-to-close
    focus-trap
    overlay-transition="vfm-fade"
    v-bind="$attrs"
  >
    <div class="base-modal__container">
      <div class="base-modal__header">
        <div class="base-modal__title">Подтверждение удаления</div>

        <ui-button
          class="base-modal__close"
          icon="close"
          type="secondary"
          @click.left.exact.prevent="close"
        />
      </div>

      <div class="base-modal__content">
        <div class="base-modal__body">
          Вы действительно хотите удалить «{{ bookmark.name }}»?

          <ui-checkbox
            v-model="dontAsk"
            type="toggle"
          >
            Больше не спрашивать
          </ui-checkbox>
        </div>
      </div>

      <div class="base-modal__controls">
        <ui-button
          type="secondary"
          @click.left.exact.prevent="close"
        >
          Отменить
        </ui-button>

        <ui-button @click.left.exact.prevent="confirm"> Удалить </ui-button>
      </div>
    </div>
  </vue-final-modal>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;

  .base-modal {
    &__container {
      background-color: var(--bg-secondary);
      width: 100%;
      max-width: 450px;
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
      line-height: 28px;
      margin-right: auto;

      @include media-min($md) {
        font-size: 22px;
      }
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
    }

    &__body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 24px;
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
