<script setup lang="ts">
  import { useToast } from 'vue-toastification';

  import { useMetrics } from '@/shared/composable/useMetrics';
  import { ToastEventBus } from '@/shared/config';
  import { useUIStore } from '@/shared/stores/UIStore';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import BookmarkSaveButton from '@/features/bookmarks/components/buttons/BookmarkSaveButton.vue';

  type Props = {
    title?: string;
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
    title: '',
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

  const fullScreenDisabled = inject<boolean>('fullScreenDisabled', false);

  const urlForCopy = computed(() => window.location.origin + route.path);

  const withExportDropdown = computed(
    () =>
      props.foundryVersions.length > 1 ||
      (props.foundryVersions.length && props.onExportLss),
  );

  const hasControls = computed(
    () =>
      props.bookmark ||
      props.print ||
      !!props.onExportLss ||
      !!props.onExportFoundry ||
      !!props.onClose ||
      (props.fullscreen && !fullScreenDisabled),
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

  const ExportButtonTooltip = computed(() => {
    let str = 'Экспорт';

    if (props.onExportFoundry) {
      str += ' для FVTT';
    } else if (props.onExportLss) {
      str += ' для LSS';
    }

    return h('span', null, [
      `${str}\xa0(`,
      h(
        'a',
        {
          href: '/info/exporting',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        'Инструкция',
      ),
      `)`,
    ]);
  });

  const exportOptions = computed(() => {
    const options = props.foundryVersions.map((version) => ({
      label: `FVTT ${version}`,
      props: {
        onClick: () => exportToFoundry(version),
      },
    }));

    if (props.onExportLss) {
      options.push({
        label: 'LSS',
        props: {
          onClick: () => exportToLss(),
        },
      });
    }

    return options;
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
        <slot
          v-if="$slots.title"
          name="title"
        />

        <n-performant-ellipsis v-else>{{ title }}</n-performant-ellipsis>
      </div>

      <div
        v-if="$slots.subtitle || subtitle"
        class="section-header__subtitle"
        @click.left.exact.prevent.stop="copyText(subtitle)"
      >
        <slot
          v-if="$slots.subtitle"
          name="subtitle"
        />

        <n-performant-ellipsis v-else>{{ subtitle }}</n-performant-ellipsis>
      </div>
    </div>

    <div
      v-if="hasControls"
      class="section-header__controls"
    >
      <n-tooltip v-if="copy">
        <template #trigger>
          <n-button
            quaternary
            @click.left.exact.prevent.stop="copyURL"
          >
            <template #icon>
              <svg-icon icon="copy" />
            </template>
          </n-button>
        </template>

        <template #default> Скопировать ссылку </template>
      </n-tooltip>

      <bookmark-save-button
        v-if="bookmark"
        :name="title"
        :url="url || ''"
      />

      <n-tooltip v-if="print">
        <template #trigger>
          <n-button
            quaternary
            class="is-only-desktop"
            @click.left.exact.prevent.stop="openPrintWindow"
          >
            <template #icon>
              <svg-icon icon="print" />
            </template>
          </n-button>
        </template>

        <template #default> Открыть окно печати </template>
      </n-tooltip>

      <n-button-group
        v-if="onExportFoundry || onExportLss"
        class="is-only-desktop"
      >
        <n-tooltip>
          <template #trigger>
            <n-button
              quaternary
              @click.left.exact.prevent.stop="onExport"
            >
              <template #icon>
                <svg-icon icon="export-foundry" />
              </template>
            </n-button>
          </template>

          <template #default>
            <export-button-tooltip />
          </template>
        </n-tooltip>

        <n-dropdown
          v-if="withExportDropdown"
          trigger="click"
          :options="exportOptions"
        >
          <n-button
            quaternary
            class="is-only-desktop"
          >
            <template #icon>
              <svg-icon icon="arrow/down" />
            </template>
          </n-button>
        </n-dropdown>
      </n-button-group>

      <n-tooltip v-if="fullscreen && !fullScreenDisabled">
        <template #trigger>
          <n-button
            quaternary
            class="is-only-desktop"
            @click.left.exact.prevent.stop="fullscreenState = !fullscreenState"
          >
            <template #icon>
              <svg-icon
                :icon="`expand/${fullscreenState ? 'exit' : 'enter'}`"
              />
            </template>
          </n-button>
        </template>

        <template #default>
          {{ fullscreenState ? 'Свернуть окно' : 'Развернуть окно' }}
        </template>
      </n-tooltip>

      <n-tooltip v-if="closeAvailable">
        <template #trigger>
          <n-button
            secondary
            @click.left.exact.prevent.stop="$emit('close')"
          >
            <template #icon>
              <svg-icon icon="close" />
            </template>
          </n-button>
        </template>

        <template #default> Закрыть </template>
      </n-tooltip>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;
  @use '@/assets/styles/variables/mixins' as *;

  .section-header {
    display: flex;
    flex-shrink: 0;
    flex-wrap: nowrap;
    align-items: flex-start;
    justify-content: flex-end;

    width: 100%;
    padding: 12px 16px 12px 16px;

    &__dropdown {
      cursor: pointer;

      overflow: hidden;

      width: 100%;
      min-width: 100px;
      max-width: 260px;
      padding: 6px 6px;

      font-size: var(--main-font-size);
      line-height: 18px;
      text-overflow: ellipsis;
      white-space: nowrap;

      border-radius: 6px;

      @include css-anim();

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
      cursor: pointer;

      position: relative;

      overflow: hidden;
      display: flex;
      align-items: center;

      min-height: var(--h3-line-height);

      font-size: var(--h3-font-size);
      font-weight: 400;
      line-height: var(--h3-line-height);
      color: var(--text-color-title);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__subtitle {
      cursor: pointer;

      overflow: hidden;

      font-size: var(--h5-font-size);
      line-height: normal;
      color: var(--text-g-color);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__controls {
      display: flex;
      flex-shrink: 0;
      gap: 4px;
      align-items: flex-start;

      > .ui-button {
        margin-left: 0;
      }

      .is-only-desktop {
        display: none;

        @include media-min($xl) {
          display: inherit;
        }
      }
    }
  }
</style>
