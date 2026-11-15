<script setup lang="ts">
  import type { DetailType } from '../model';

  import { useContentLinkHandler } from '../composables';
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

  const linkHandler = useContentLinkHandler();

  /**
   * Открывает дровер вместо перехода по ссылке внутри подсказки, если
   * запись не взял на себя свой обработчик (например, окно ширмы).
   * @param event - клик левой кнопкой без модификаторов
   */
  function open(event: MouseEvent): void {
    event.preventDefault();

    const isHandled =
      !!url
      && !!linkHandler?.({
        path: url,
        title,
        origin: { x: event.clientX, y: event.clientY },
      });

    // Ссылка внутри подсказки спросила бы обработчик второй раз
    if (isHandled) {
      event.stopPropagation();

      return;
    }

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
