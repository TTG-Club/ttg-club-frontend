<script setup lang="ts">
  import type { DetailType } from '../model';

  import { z } from 'zod';

  import { DETAIL_TOOLTIP_TEXT, RAW_TOOLTIP_PREFIX } from '../model';

  /**
   * Подсказка со ссылкой на сущность: замена `DetailTooltip` старого SPA.
   * Подсказки с типом получат карточки сущностей вместе с их разделами,
   * а пока выводят только ссылку. Подсказка без типа подгружает HTML
   * с адреса API.
   */
  const { type = undefined, url = undefined } = defineProps<{
    type?: DetailType;
    url?: string;
  }>();

  // Рендер контента ссылается на подсказку, поэтому подключается лениво.
  const ContentRender = defineAsyncComponent(() =>
    import('../render').then((module) => module.ContentRender),
  );

  const html = ref<string>();
  const isLoading = ref(false);
  const isError = ref(false);

  const rawUrl = computed(() =>
    !type && url?.startsWith(RAW_TOOLTIP_PREFIX) ? url : undefined,
  );

  async function load(isOpen: boolean) {
    if (!isOpen || !rawUrl.value || html.value || isLoading.value) {
      return;
    }

    isLoading.value = true;
    isError.value = false;

    try {
      const response: unknown = await $fetch(rawUrl.value, {
        responseType: 'text',
      });

      html.value = z.string().parse(response);
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }
</script>

<template>
  <UPopover
    v-if="rawUrl"
    mode="hover"
    @update:open="load"
  >
    <span>
      <slot />
    </span>

    <template #content>
      <div class="max-h-96 max-w-md overflow-auto p-3">
        <p v-if="isLoading">
          {{ DETAIL_TOOLTIP_TEXT.loading }}
        </p>

        <p v-else-if="isError">
          {{ DETAIL_TOOLTIP_TEXT.error }}
        </p>

        <ContentRender
          v-else-if="html"
          :html="html"
        />
      </div>
    </template>
  </UPopover>

  <slot v-else />
</template>
