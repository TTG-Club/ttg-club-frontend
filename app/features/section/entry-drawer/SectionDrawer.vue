<script setup lang="ts">
  import { LAYOUT_DRAWER_QUERY } from '~/shared/consts';

  import { SECTION_ICON, SECTION_TEXT } from '../model';

  /**
   * Дровер справа, как карточки на new.ttg.club: заголовок, кнопки
   * «Открыть страницу» и «Закрыть», под ними содержимое с загрузкой и ошибкой.
   */
  const {
    title,
    subtitle = undefined,
    path = undefined,
    isLoading = false,
    isError = false,
  } = defineProps<{
    title: string;
    subtitle?: string;
    /** Адрес страницы записи; без него кнопки перехода нет. */
    path?: string;
    isLoading?: boolean;
    isError?: boolean;
  }>();

  const isOpen = defineModel<boolean>('open', { default: false });

  defineSlots<{
    default: () => unknown;
  }>();

  const isWide = useMediaQuery(LAYOUT_DRAWER_QUERY);

  function close(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UDrawer
    v-model:open="isOpen"
    :title="title"
    :description="subtitle ?? ''"
    :inset="isWide"
    :handle="false"
    direction="right"
    :ui="{
      content: 'w-full max-w-2xl',
      title: 'sr-only',
      description: 'sr-only',
    }"
  >
    <template #header>
      <div class="flex w-full items-start gap-3">
        <div class="min-w-0 flex-auto">
          <p class="font-serif text-xl text-title">
            {{ title }}
          </p>

          <p
            v-if="subtitle"
            class="text-sm text-muted"
          >
            {{ subtitle }}
          </p>
        </div>

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
            @click.left.exact="close"
          />
        </UTooltip>

        <UButton
          :icon="SECTION_ICON.close"
          :aria-label="SECTION_TEXT.close"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="close"
        />
      </div>
    </template>

    <template #body>
      <div
        v-if="isLoading"
        class="flex flex-col gap-2"
      >
        <USkeleton
          v-for="index in 6"
          :key="index"
          class="h-6 w-full"
        />
      </div>

      <p v-else-if="isError">
        {{ SECTION_TEXT.detailError }}
      </p>

      <slot v-else />
    </template>
  </UDrawer>
</template>
