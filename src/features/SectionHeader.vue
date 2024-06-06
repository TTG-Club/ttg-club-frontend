<script setup lang="ts">
  import { useClipboard } from '@vueuse/core';
  import { storeToRefs } from 'pinia';
  import { computed, h } from 'vue';
  import { useRoute } from 'vue-router';
  import { useToast } from 'vue-toastification';

  import { ToastEventBus } from '@/core/configs/ToastConfig';

  import { useMetrics } from '@/shared/composables/useMetrics';
  import { useUIStore } from '@/shared/stores/UIStore';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';

  import BookmarkSaveButton from '@/features/bookmarks/components/buttons/BookmarkSaveButton.vue';

  type Props = {
    title: string;
    subtitle?: string;
    url?: string;
    copy?: boolean;
    bookmark?: boolean;
    print?: boolean;
    fullscreen?: boolean;
    foundryVersions?: Array<10 | 11 | 12>;
    defaultFoundry?: 10 | 11 | 12;
    exportLss?: boolean;
    onExportLss?: () => void;
    onExportFoundry?: (version: number) => void;
    onClose?: () => void;
  };

  const props = withDefaults(defineProps<Props>(), {
    subtitle: '',
    url: '',
    copy: false,
    bookmark: false,
    print: false,
    fullscreen: false,
    foundryVersions: () => [11],
    defaultFoundry: 11,
    onExportLss: undefined,
    onExportFoundry: undefined,
    onClose: undefined,
  });

  type Emit = {
    (e: 'exportFoundry', version: number): void;
    (e: 'exportLss'): void;
    (e: 'close'): void;
  };

  const emit = defineEmits<Emit>();

  const route = useRoute();
  const uiStore = useUIStore();
  const clipboard = useClipboard();
  const { sendShareMetrics } = useMetrics();
  const toast = useToast(ToastEventBus);
  const { fullscreen: fullscreenState } = storeToRefs(uiStore);

  const urlForCopy = computed(() => window.location.origin + route.path);

  const withExportDropdown = computed(
    () => props.foundryVersions.length > 1 || props.onExportLss,
  );

  const hasControls = computed(
    () =>
      props.bookmark ||
      props.print ||
      !!props.onExportLss ||
      !!props.onExportFoundry ||
      !!props.onClose ||
      props.fullscreen,
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
          id: route.path,
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
                href: 'https://discord.gg/JqFKMKRtxv',
                rel: 'noopener',
              },
              'Discord-канале',
            ),
          ]),
        ),
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

  const exportToFoundry = (version?: Props['defaultFoundry']) => {
    let ver = props.defaultFoundry || 11;

    if (props.foundryVersions.length === 1) {
      [ver] = props.foundryVersions;
    }

    if (props.foundryVersions.length > 1 && version) {
      ver = version;
    }

    sendShareMetrics({
      method: 'export_foundry',
      id: route.path,
    });

    emit('exportFoundry', ver);
  };

  const exportToLss = () => {
    sendShareMetrics({
      method: 'export_lss',
      id: route.path,
    });

    emit('exportLss');
  };

  const exportButtonTooltip = computed(() => {
    let str = 'Экспорт';

    if (props.onExportFoundry) {
      str += ' для FVTT';
    } else if (props.onExportLss) {
      str += ' для LSS';
    }

    return {
      content: `<span>${str}&nbsp;(<a href="/info/exporting" target="_blank" rel="noopener noreferrer">Инструкция</a>)</span>`,
    };
  });

  const onExport = () => {
    if (props.onExportFoundry) {
      exportToFoundry();

      return;
    }

    exportToLss();
  };
</script>

<template>
  <div class="section-header">
    <div class="section-header__body">
      <div
        class="section-header__title"
        @click.left.exact.prevent.stop="copyText(title)"
      >
        {{ title }}
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
      <ui-button
        v-if="copy"
        :tooltip="{ content: 'Скопировать ссылку' }"
        class="section-header__control"
        icon="copy"
        type="text"
        color="text"
        size="sm"
        @click.left.exact.prevent.stop="copyURL"
      />

      <bookmark-save-button
        v-if="bookmark"
        :name="title"
        :url="url || ''"
        color="text"
        size="sm"
      />

      <ui-button
        v-if="print"
        :tooltip="{ content: 'Открыть окно печати' }"
        class="section-header__control is-only-desktop"
        icon="print"
        type="text"
        color="text"
        size="sm"
        @click.left.exact.prevent.stop="openPrintWindow"
      />

      <ui-button
        v-if="onExportFoundry || onExportLss"
        :tooltip="exportButtonTooltip"
        class="section-header__control is-only-desktop"
        icon="export-foundry"
        type="text"
        color="text"
        size="sm"
        split
        @click.left.exact.prevent="onExport"
      >
        <template
          v-if="withExportDropdown"
          #dropdown
        >
          <div
            v-for="(version, key) in foundryVersions"
            :key="key"
            class="section-header__dropdown"
            @click.left.exact.prevent="exportToFoundry(version)"
            @dblclick.prevent.stop
          >
            FVTT {{ version }}
          </div>

          <div
            v-if="onExportLss"
            class="section-header__dropdown"
            @click.left.exact.prevent="exportToLss"
            @dblclick.prevent.stop
          >
            LSS
          </div>
        </template>
      </ui-button>

      <ui-button
        v-if="fullscreen"
        :tooltip="{
          content: fullscreenState ? 'Свернуть окно' : 'Развернуть окно',
        }"
        class="section-header__control is-only-desktop"
        :icon="`expand/${fullscreenState ? 'exit' : 'enter'}`"
        type="text"
        color="text"
        size="sm"
        @click.left.exact.prevent.stop="fullscreenState = !fullscreenState"
      />

      <ui-button
        v-if="closeAvailable"
        :tooltip="{ content: 'Закрыть' }"
        class="section-header__control"
        icon="close"
        type="secondary"
        size="sm"
        @click.left.exact.prevent.stop="$emit('close')"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;
  @use '@/assets/styles/variables/mixins' as *;

  .section-header {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    flex-wrap: nowrap;
    flex-shrink: 0;
    padding: 12px 16px 12px 16px;

    &__dropdown {
      @include css_anim();

      padding: 6px 6px;
      border-radius: 6px;
      cursor: pointer;
      min-width: 100px;
      max-width: 260px;
      white-space: nowrap;
      overflow: hidden;
      width: 100%;
      text-overflow: ellipsis;
      line-height: 18px;
      font-size: var(--main-font-size);

      &:hover {
        background-color: var(--hover);
      }
    }

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
      font-size: var(--h3-font-size);
      line-height: var(--h3-line-height);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      position: relative;
      color: var(--text-color-title);
      font-weight: 400;
      cursor: pointer;
      min-height: var(--h3-line-height);
    }

    &__subtitle {
      font-size: var(--h5-font-size);
      color: var(--text-g-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: normal;
      cursor: pointer;
    }

    &__controls {
      display: flex;
      align-items: flex-start;
      flex-shrink: 0;
      gap: 4px;

      > .ui-button {
        margin-left: 0;
      }
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
