<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { RouteLocationRaw } from 'vue-router';

  import type { EntrySource } from '../model';

  import {
    SECTION_ICON,
    SECTION_PRINT_QUERY_KEY,
    SECTION_PRINT_QUERY_VALUE,
    SECTION_TEXT,
  } from '../model';
  import { SectionSourceTag } from '../source-tag';

  /**
   * Панель открытой записи раздела: заголовок, закладка, закрытие и
   * содержимое. Остальные действия (ссылка, правка, печать, экспорт)
   * спрятаны в меню «три точки», чтобы шапка не обрастала кнопками.
   */
  const {
    title,
    subtitle = undefined,
    source = undefined,
    closeTo = undefined,
    path = undefined,
    editUrl = undefined,
    isLoading = false,
    isError = false,
    menuItems = [],
  } = defineProps<{
    title: string;
    subtitle?: string;
    /** Источник записи: метки справа от английского названия. */
    source?: EntrySource | null;
    /** Куда ведёт закрытие; без адреса панель просит закрыть себя событием. */
    closeTo?: RouteLocationRaw;
    /**
     * Адрес записи, когда панель стоит рядом со списком: адрес страницы
     * тогда ведёт на раздел, а не на запись.
     */
    path?: string;
    /** Страница записи в мастерской; мастерская пока живёт в старом SPA. */
    editUrl?: string;
    isLoading?: boolean;
    isError?: boolean;
    /** Дополнительные пункты меню записи, например экспорт. */
    menuItems?: Array<DropdownMenuItem>;
  }>();

  /** Кнопки записи: в шапке, а на телефоне плавают в правом нижнем углу. */
  const ACTIONS_CLASS = [
    'flex shrink-0 items-center gap-1',
    'max-md:fixed max-md:right-2 max-md:bottom-(--navbar-height) max-md:z-10 max-md:mb-2',
    'max-md:rounded-md max-md:border max-md:border-default max-md:p-1',
    'max-md:bg-default/50 max-md:shadow-md max-md:backdrop-blur-lg',
  ];

  const emit = defineEmits<{
    close: [];
  }>();

  const route = useRoute();
  const router = useRouter();
  const siteConfig = useSiteConfig();
  const toast = useToast();
  const { copy, isSupported } = useClipboard({ legacy: true });
  const { isEditor } = useUser();

  const isReady = computed(() => !isLoading && !isError);

  const isEditAvailable = computed(
    () => !!editUrl && isEditor.value && isReady.value,
  );

  /** Запись печатается: печать прячет всё остальное на странице. */
  const isPrinting = ref(false);

  const printTarget = computed(() => (isPrinting.value ? '' : undefined));

  useEventListener('afterprint', () => {
    isPrinting.value = false;
  });

  const actionItems = computed<Array<Array<DropdownMenuItem>>>(() => {
    const linkItems: Array<DropdownMenuItem> = [
      {
        label: SECTION_TEXT.copyLink,
        icon: SECTION_ICON.copy,
        onSelect: copyLink,
      },
    ];

    if (path) {
      linkItems.unshift({
        label: SECTION_TEXT.openPage,
        icon: SECTION_ICON.openPage,
        to: path,
      });
    }

    const editItems: Array<DropdownMenuItem> = isEditAvailable.value
      ? [{ label: SECTION_TEXT.edit, icon: SECTION_ICON.edit, to: editUrl }]
      : [];

    const outputItems: Array<DropdownMenuItem> = [
      { label: SECTION_TEXT.print, icon: SECTION_ICON.print, onSelect: print },
      ...menuItems,
    ];

    return [linkItems, editItems, outputItems].filter(
      (group) => group.length > 0,
    );
  });

  function close(): void {
    emit('close');
  }

  /** Печатает только запись, как кнопка печати старого SPA. */
  async function printEntry(): Promise<void> {
    isPrinting.value = true;

    await nextTick();

    window.print();
  }

  /**
   * Печать из меню. Запись рядом со списком открывается на своей странице
   * и печатается там: на узком листе панель рядом со списком не видна.
   */
  async function print(): Promise<void> {
    if (path) {
      await navigateTo({
        path,
        query: { [SECTION_PRINT_QUERY_KEY]: SECTION_PRINT_QUERY_VALUE },
      });

      return;
    }

    await printEntry();
  }

  /** Печать, заказанная адресом: параметр снимается, чтобы не повторить её. */
  async function printRequested(): Promise<void> {
    const { [SECTION_PRINT_QUERY_KEY]: _printRequest, ...query } = route.query;

    await router.replace({ query });
    await printEntry();
  }

  onMounted(() => {
    watch(
      isReady,
      (ready) => {
        const isRequested =
          route.query[SECTION_PRINT_QUERY_KEY] === SECTION_PRINT_QUERY_VALUE;

        if (ready && !path && isRequested) {
          void printRequested();
        }
      },
      { immediate: true },
    );
  });

  /** Копирует каноничную ссылку на запись, без параметров списка. */
  async function copyLink() {
    if (!isSupported.value) {
      toast.add({ title: SECTION_TEXT.copyError, color: 'error' });

      return;
    }

    try {
      await copy(`${siteConfig.url}${path ?? route.path}`);

      toast.add({ title: SECTION_TEXT.linkCopied, icon: SECTION_ICON.copy });
    } catch {
      toast.add({ title: SECTION_TEXT.copyError, color: 'error' });
    }
  }
</script>

<template>
  <article
    class="flex flex-col gap-4 pt-2"
    :data-print-target="printTarget"
  >
    <header class="flex flex-col gap-1 border-b border-default pb-3">
      <div class="flex items-start gap-3">
        <div class="min-w-0 flex-auto">
          <USkeleton
            v-if="isLoading && !title"
            class="h-8 w-2/3"
          />

          <h2
            v-else
            class="text-2xl text-highlighted"
          >
            {{ title }}
          </h2>
        </div>

        <!-- На телефоне кнопки висят в правом нижнем углу, как на new.ttg.club -->
        <div
          :class="ACTIONS_CLASS"
          class="print:hidden"
        >
          <template v-if="isReady">
            <slot name="actions" />

            <UDropdownMenu
              :items="actionItems"
              :content="{ align: 'end' }"
            >
              <UButton
                :icon="SECTION_ICON.more"
                :aria-label="SECTION_TEXT.actions"
                color="neutral"
                variant="ghost"
              />
            </UDropdownMenu>
          </template>

          <UButton
            v-if="closeTo"
            :to="closeTo"
            :icon="SECTION_ICON.close"
            :aria-label="SECTION_TEXT.close"
            color="neutral"
            variant="ghost"
          />

          <UButton
            v-else
            :icon="SECTION_ICON.close"
            :aria-label="SECTION_TEXT.close"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="close"
          />
        </div>
      </div>

      <div
        v-if="subtitle || source"
        class="flex items-center justify-between gap-2"
      >
        <span class="truncate text-sm text-muted">{{ subtitle }}</span>

        <SectionSourceTag
          v-if="source"
          :source="source"
        />
      </div>
    </header>

    <div
      v-if="isLoading"
      class="flex flex-col gap-2"
    >
      <USkeleton
        v-for="index in 6"
        :key="index"
        class="h-4 w-full"
      />
    </div>

    <UEmpty
      v-else-if="isError"
      :icon="SECTION_ICON.empty"
      :title="SECTION_TEXT.detailError"
    />

    <slot v-else />
  </article>
</template>
