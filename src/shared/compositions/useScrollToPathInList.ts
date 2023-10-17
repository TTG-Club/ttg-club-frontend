import { storeToRefs } from 'pinia';
import { computed, ref, unref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useReference } from '@/shared/compositions/useReference';
import { CONTENT_LAYOUT_FIXED_HEADER_SELECTOR } from '@/shared/constants/UI';
import { asyncAnimationFrame } from '@/shared/helpers/dom';
import { useUIStore } from '@/shared/stores/UIStore';
import type { Maybe } from '@/shared/types/Utility';
import type { TVirtualListRef } from '@/shared/ui/virtual-views/VirtualList/types';

import type { MaybeRef } from '@vueuse/core';
import type { Ref } from 'vue';

interface UseScrollToPathInListParams {
  items: Ref<unknown[]>;
  disabled?: MaybeRef<boolean>;
  showRightSide?: MaybeRef<boolean>;
}

/**
 * Хук для скролла к элементу в виртуальном списке
 */
export const useScrollToPathInList = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  items,
  disabled,
  showRightSide
}: UseScrollToPathInListParams) => {
  const route = useRoute();
  const uiStore = useUIStore();
  const isDisabled = computed(() => unref(disabled));

  // Рефка на компонент списка
  const [reference, setReference] = useReference<TVirtualListRef>();

  const { bodyElement } = storeToRefs(uiStore);

  const scrollToItem = (value: string, oldValue?: string) => {
    let scrolled: Maybe<ReturnType<TVirtualListRef['scrollToItemByKey']>>;

    // Скроллим к элементу в детальной странице
    scrolled = reference.value?.scrollToItemByKey(value);

    // Скроллим к элементу в списке, при закрытии детальной страницы
    if (!scrolled?.scrolled && oldValue) {
      scrolled = reference.value?.scrollToItemByKey(oldValue);
    }

    return scrolled;
  };

  const scrollToPath = async (value: string, oldValue?: string) => {
    if (isDisabled.value) {
      return;
    }

    // Скроллим к элементу с помощью метода библиотеки vue-virtual-scroll-list
    const { scrolled, index } = scrollToItem(value, oldValue) || {};

    if (!scrolled) {
      return;
    }

    // Если скролл произошел, то ждем два фрейма, чтобы убедиться, что элемент отрендерился
    await asyncAnimationFrame();
    await asyncAnimationFrame();

    // Далее нужно убедиться, что элемент находится внутри списка
    // и поправить скролл, если он некорректный (из-за шапки списка, например)
    if (!bodyElement.value) {
      return;
    }

    const item = reference.value?.scroller.$el.querySelector(
      `[data-index="${index}"]`
    )?.parentElement;

    const itemRect = item.getBoundingClientRect();

    const fixedHeader = bodyElement.value.querySelector(
      CONTENT_LAYOUT_FIXED_HEADER_SELECTOR
    );

    const headerHeight = fixedHeader?.clientHeight || 0;

    // Разница, на которую нужно поправить скролл
    const finishingScroll = headerHeight - itemRect.top;

    bodyElement.value.scrollTop -= finishingScroll;
  };

  const preventScroll = ref(unref(showRightSide));

  // Скроллим к элементу при изменении пути
  watch(
    () => route.path,
    (value, oldValue) => {
      // Не скроллим к элементу, если открыт детальник
      if (unref(showRightSide)) {
        if (preventScroll.value) {
          return;
        }

        // Блокируем скролл к следующему элементу, если открыли детальник
        preventScroll.value = true;
      } else {
        // Разблокируем скролл к следующему элементу, если закрыли детальник
        preventScroll.value = false;
      }

      scrollToPath(value, oldValue);
    },
    {
      immediate: true,
      flush: 'post'
    }
  );

  return {
    reference,
    setReference
  };
};
