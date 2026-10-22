<script setup lang="ts">
  import type { DetailType } from '../model';

  import { RAW_TOOLTIP_PREFIX } from '../model';

  /**
   * Ссылка на сущность из текста: замена `DetailTooltip` старого SPA. Вместо
   * всплывающей подсказки карточка открывается дровером, как на
   * new.ttg.club. Клик с Ctrl или колесом по-прежнему ведёт на страницу.
   */
  const {
    type = undefined,
    url = undefined,
    title,
  } = defineProps<{
    type?: DetailType;
    url?: string;
    title: string;
  }>();

  // Дроверы тянут карточки всех разделов, а ссылка в них снова рисует
  // этот компонент, поэтому они подключаются лениво — по первому клику.
  const ContentEntityDrawer = defineAsyncComponent(() =>
    import('../entity-drawer').then((module) => module.ContentEntityDrawer),
  );

  const ContentRawDrawer = defineAsyncComponent(() =>
    import('../entity-drawer').then((module) => module.ContentRawDrawer),
  );

  const rawUrl = computed(() =>
    !type && url?.startsWith(RAW_TOOLTIP_PREFIX) ? url : undefined,
  );

  const isClickable = computed(() => !!(type && url) || !!rawUrl.value);

  // У подсказки без типа внутри нет ссылки, поэтому она подчёркивается сама
  const triggerClass = computed(() =>
    rawUrl.value
      ? 'cursor-pointer underline decoration-dotted underline-offset-4'
      : 'cursor-pointer',
  );

  const isOpen = ref(false);
  const isMounted = ref(false);

  /**
   * Открывает дровер вместо перехода по ссылке внутри подсказки.
   * @param event - клик левой кнопкой без модификаторов
   */
  function open(event: MouseEvent): void {
    event.preventDefault();

    isMounted.value = true;
    isOpen.value = true;
  }
</script>

<template>
  <span
    v-if="isClickable"
    :class="triggerClass"
    @click.left.exact.capture="open"
  >
    <slot />
  </span>

  <slot v-else />

  <ContentEntityDrawer
    v-if="isMounted && type && url"
    v-model:open="isOpen"
    :type="type"
    :path="url"
    :title="title"
  />

  <ContentRawDrawer
    v-else-if="isMounted && rawUrl"
    v-model:open="isOpen"
    :url="rawUrl"
    :title="title"
  />
</template>
