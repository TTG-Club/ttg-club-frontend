<script setup lang="ts">
  import { z } from 'zod';

  import { SectionDrawer } from '~section/entry-drawer';

  import { ContentRender } from '../render';

  /**
   * Подсказка без типа: HTML с адреса API в дровере. Заголовок — текст
   * ссылки, по которой её открыли.
   */
  const { url, title } = defineProps<{
    url: string;
    title: string;
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  const {
    data: html,
    status,
    execute,
  } = useAsyncData(
    () => `content-raw-drawer:${url}`,
    async () => z.string().parse(await $fetch(url, { responseType: 'text' })),
    { server: false, immediate: false },
  );

  const isLoading = computed(
    () => status.value === 'idle' || status.value === 'pending',
  );

  const isError = computed(() => status.value === 'error');

  watch(
    isOpen,
    (value) => {
      if (value && !html.value && status.value !== 'pending') {
        execute();
      }
    },
    { immediate: true },
  );
</script>

<template>
  <SectionDrawer
    v-model:open="isOpen"
    :title="title"
    :is-loading="isLoading"
    :is-error="isError"
  >
    <ContentRender
      v-if="html"
      :html="html"
    />
  </SectionDrawer>
</template>
