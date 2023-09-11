<template>
  <div class="section-header">
    <div class="section-header__body">
      <div class="section-header__title">
        <div
          class="section-header__title--text"
          @click.left.exact.prevent.stop="copyText(title)"
        >
          {{ title }}
        </div>

        <a
          v-if="copy"
          v-tippy="{ content: 'Скопировать ссылку' }"
          :href="urlForCopy"
          class="section-header__title--copy"
          @click.left.exact.prevent.stop="copyURL"
        >
          <svg-icon icon="copy" />
        </a>
      </div>

      <div
        v-if="subtitle"
        class="section-header__subtitle"
        @click.left.exact.prevent.stop="copyText(subtitle)"
      >
        {{ subtitle }}
      </div>
    </div>

    <div
      v-if="hasControls"
      class="section-header__controls"
    >
      <bookmark-save-button
        v-if="bookmark"
        :name="title"
        :url="url || ''"
        color="text"
      />

      <ui-button
        v-if="print"
        v-tippy="{ content: 'Открыть окно печати' }"
        class="section-header__control is-only-desktop"
        icon="print"
        type="text"
        color="text"
        @click.left.exact.prevent.stop="openPrintWindow"
      />

      <ui-button
        v-if="onExportFoundry"
        v-tippy="{
          // eslint-disable-next-line vue/max-len
          content:
            '<span>Импорт в Foundry VTT 10.&nbsp;<a href=&#34;/info/fvtt_import&#34; target=&#34;_blank&#34;>Инструкция</a>'
        }"
        class="section-header__control is-only-desktop"
        icon="export-foundry"
        type="text"
        color="text"
        @click.left.exact.prevent.stop="exportToFoundry"
      />

      <ui-button
        v-if="fullscreen"
        v-tippy="{
          content: uiStore.fullscreen ? 'Свернуть окно' : 'Развернуть окно'
        }"
        class="section-header__control is-only-desktop"
        :icon="`expand/${uiStore.fullscreen ? 'exit' : 'enter'}`"
        type="text"
        color="text"
        @click.left.exact.prevent.stop="toggleFullscreen"
      />

      <ui-button
        v-if="closeAvailable"
        v-tippy="{ content: 'Закрыть' }"
        class="section-header__control"
        icon="close"
        type="secondary"
        @click.left.exact.prevent.stop="$emit('close')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useClipboard } from '@vueuse/core';
  import { computed, h } from 'vue';
  import { useRoute } from 'vue-router';
  import { useToast } from 'vue-toastification';

  import { ToastEventBus } from '@/app/configs/ToastConfig';

  import BookmarkSaveButton from '@/features/bookmarks/components/buttons/BookmarkSaveButton.vue';

  import { useMetrics } from '@/shared/compositions/useMetrics';
  import { useUIStore } from '@/shared/stores/UIStore';
  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';

  const props = withDefaults(
    defineProps<{
      title: string;
      subtitle?: string;
      url?: string;
      copy?: boolean;
      bookmark?: boolean;
      print?: boolean;
      fullscreen?: boolean;
      onExportFoundry?: () => void;
      onClose?: () => void;
    }>(),
    {
      subtitle: '',
      url: '',
      copy: false,
      bookmark: false,
      print: false,
      fullscreen: false,
      onExportFoundry: undefined,
      onClose: undefined
    }
  );

  type Emit = {
    (e: 'exportFoundry'): void;
    (e: 'close'): void;
  };

  const emit = defineEmits<Emit>();

  const route = useRoute();
  const uiStore = useUIStore();
  const clipboard = useClipboard();
  const { sendShareMetrics } = useMetrics();
  const toast = useToast(ToastEventBus);
  const { toggleFullscreen } = uiStore;

  const urlForCopy = computed(() => window.location.origin + route.path);

  const hasControls = computed(
    () =>
      props.bookmark ||
      props.print ||
      !!props.onExportFoundry ||
      !!props.onClose ||
      props.fullscreen
  );

  const closeAvailable = computed(() => props.onClose);

  const copyURL = () => {
    if (!clipboard.isSupported) {
      toast.error('Ваш браузер не поддерживает копирование');
    }

    clipboard
      .copy(urlForCopy.value)
      .then(() => {
        toast('Ссылка успешно скопирована');

        sendShareMetrics({
          method: 'link_copy',
          id: route.path
        });
      })
      .catch(() =>
        toast.error(() =>
          h('span', null, [
            'Произошла какая-то ошибка... попробуйте еще раз или обратитесь за помощью на нашем ',
            h(
              'a',
              {
                target: '_blank',
                href: 'https://discord.gg/zqBnMJVf3z',
                rel: 'noopener'
              },
              'Discord-канале'
            )
          ])
        )
      );
  };

  const copyText = (text?: string) => {
    if (!text) {
      return;
    }

    clipboard.copy(text).then(() => toast('Текст скопирован'));
  };

  const openPrintWindow = () => {
    window.print();
  };

  const exportToFoundry = () => {
    sendShareMetrics({
      method: 'export_foundry',
      id: route.path
    });

    emit('exportFoundry');
  };
</script>

<style lang="scss" scoped>
  .section-header {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    flex-wrap: nowrap;
    flex-shrink: 0;
    padding: 12px 16px 12px 16px;

    @include media-min($xl) {
      padding: 16px 24px 16px 24px;
    }

    &__body {
      flex: 1;
      min-width: 0;
      padding-right: 8px;
    }

    &__title {
      display: flex;
      align-items: center;

      &--text {
        font-size: var(--h3-font-size);
        line-height: var(--h3-line-height);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        position: relative;
        color: var(--text-color-title);
        font-weight: 400;
        cursor: pointer;
      }

      &--copy {
        @include css_anim();

        display: none;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        margin-left: 6px;
        padding: 4px;
        border-radius: 8px;
        color: var(--primary);
        background-color: transparent;
        cursor: pointer;
        flex-shrink: 0;
        transform: translateY(2px);

        @media (min-width: 800px) {
          display: flex;

          &:hover {
            background-color: var(--primary-hover);
            color: var(--text-btn-color);
          }
        }
      }
    }

    &__subtitle {
      font-size: calc(var(--h2-font-size) - 14px);
      color: var(--text-g-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: normal;
      cursor: pointer;

      @media (max-width: 1200px) {
        margin-top: 4px;
      }
    }

    &__controls {
      display: flex;
      align-items: flex-start;
      flex-shrink: 0;
    }

    &__control {
      &.is-only-desktop {
        display: none;

        @include media-min($xl) {
          display: inherit;
        }
      }
    }
  }
</style>
