<script setup lang="ts">
  import type { RouteLocationRaw } from 'vue-router';

  import { SECTION_ICON, SECTION_TEXT } from '../model';

  /**
   * Панель открытой записи раздела: заголовок, ссылка на запись, правка
   * для редакторов, закрытие и содержимое.
   */
  const {
    title,
    subtitle = undefined,
    closeTo = undefined,
    path = undefined,
    editUrl = undefined,
    isLoading = false,
    isError = false,
  } = defineProps<{
    title: string;
    subtitle?: string;
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
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const route = useRoute();
  const siteConfig = useSiteConfig();
  const toast = useToast();
  const { copy, isSupported } = useClipboard({ legacy: true });
  const { isEditor } = useUser();

  const isReady = computed(() => !isLoading && !isError);

  const isEditAvailable = computed(
    () => !!editUrl && isEditor.value && isReady.value,
  );

  function close(): void {
    emit('close');
  }

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
  <article class="flex flex-col gap-4 pt-2">
    <header class="flex items-start gap-3 border-b border-default pb-3">
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

        <div
          v-if="subtitle"
          class="text-sm text-muted"
        >
          {{ subtitle }}
        </div>
      </div>

      <template v-if="isReady">
        <UTooltip :text="SECTION_TEXT.copyLink">
          <UButton
            :icon="SECTION_ICON.copy"
            :aria-label="SECTION_TEXT.copyLink"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="copyLink"
          />
        </UTooltip>

        <slot name="actions" />

        <UTooltip
          v-if="path"
          :text="SECTION_TEXT.openPage"
        >
          <UButton
            :to="path"
            :icon="SECTION_ICON.openPage"
            :aria-label="SECTION_TEXT.openPage"
            color="neutral"
            variant="ghost"
          />
        </UTooltip>

        <UTooltip
          v-if="isEditAvailable"
          :text="SECTION_TEXT.edit"
        >
          <UButton
            :to="editUrl"
            :icon="SECTION_ICON.edit"
            :aria-label="SECTION_TEXT.edit"
            color="neutral"
            variant="ghost"
          />
        </UTooltip>
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
