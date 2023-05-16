<template>
  <vue-final-modal
    v-slot="{ params, close }"
    class="base-modal"
    content-transition="vfm-fade"
    esc-to-close
    focus-trap
    overlay-transition="vfm-fade"
    v-bind="$attrs"
  >
    <div class="base-modal__container">
      <div class="base-modal__header">
        <div class="base-modal__title">
          <slot name="title" />
        </div>

        <bookmark-save-button
          v-if="bookmark?.name"
          :name="bookmark.name"
          :url="bookmark?.url"
        />

        <ui-button
          class="base-modal__close"
          is-icon
          type-link
          @click.left.exact.prevent="close"
        >
          <svg-icon icon-name="close" />
        </ui-button>
      </div>

      <div class="base-modal__content">
        <div class="base-modal__safe">
          <div class="base-modal__body">
            <slot :params="params" />
          </div>
        </div>
      </div>

      <div
        v-if="$slots.footer"
        class="base-modal__footer"
      >
        <slot
          :close="close"
          name="footer"
        />
      </div>

      <div
        v-else-if="typeConfirm"
        class="base-modal__footer"
      >
        <ui-button @click.left.exact.prevent="$emit('confirm', close)">
          Применить
        </ui-button>

        <ui-button
          type-outline
          @click.left.exact.prevent="close"
        >
          Отменить
        </ui-button>
      </div>

      <div
        v-else-if="typeRemove"
        class="base-modal__footer"
      >
        <ui-button @click.left.exact.prevent="$emit('confirm', close)">
          Удалить
        </ui-button>

        <ui-button
          type-outline
          @click.left.exact.prevent="close"
        >
          Отменить
        </ui-button>
      </div>

      <div
        v-else-if="typeNotify"
        class="base-modal__footer"
      >
        <ui-button
          type-outline
          @click.left.exact.prevent="close"
        >
          Закрыть
        </ui-button>
      </div>

      <div
        v-else-if="typeError"
        class="base-modal__footer"
      >
        <ui-button
          outline
          @click.left.exact.prevent="close"
        >
          Закрыть
        </ui-button>
      </div>
    </div>
  </vue-final-modal>
</template>

<script lang="ts" setup>
  import { VueFinalModal } from 'vue-final-modal';
  import { computed } from 'vue';
  import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
  import UiButton from '@/components/UI/kit/UiButton.vue';
  import BookmarkSaveButton from '@/components/UI/menu/bookmarks/buttons/BookmarkSaveButton.vue';

  const props = withDefaults(defineProps<{
    typeConfirm?: boolean;
    typeRemove?: boolean;
    typeNotify?: boolean;
    typeError?: boolean;
    bookmark?: any;
  }>(), {
    typeConfirm: false,
    typeRemove: false,
    typeNotify: false,
    typeError: false,
    bookmark: undefined
  });

  const emit = defineEmits(['confirm']);

  const type = computed(() => {
    if (props.typeConfirm) {
      return 'confirm';
    }

    if (props.typeRemove) {
      return 'remove';
    }

    if (props.typeNotify) {
      return 'notify';
    }

    if (props.typeError) {
      return 'error';
    }

    return '';
  });
</script>

<style lang="scss" scoped>
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

    &__bookmark {
      margin: {
        left: 16px;
        top: -6px;
        right: -6px;
        bottom: -6px;
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
  }
</style>
