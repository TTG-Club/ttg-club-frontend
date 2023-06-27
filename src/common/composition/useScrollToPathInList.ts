import type { Ref } from 'vue';
import {
  computed, ref, unref, watch
} from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import type { MaybeRef } from '@vueuse/core';
import { useUIStore } from '@/store/UI/UIStore';
import { useReference } from '@/common/composition/useReference';
import { asyncAnimationFrame } from '@/common/helpers/dom';
import type { TVirtualListRef } from '@/components/list/VirtualList/types';
import { CONTENT_LAYOUT_FIXED_HEADER_SELECTOR } from '@/common/const/UI';
import type { Maybe } from '@/types/Shared/Utility.types';

interface UseScrollToPathInListParams {
  items: Ref<unknown[]>;
  disabled?: MaybeRef<boolean>;
  showRightSide?: MaybeRef<boolean>;
}

/**
 * Хук для скролла к элементу в виртуальном списке
 */
export const useScrollToPathInList = ({
  items, disabled, showRightSide
}: UseScrollToPathInListParams) => {
  const route = useRoute();
  const uiStore = useUIStore();
  const isDisabled = computed(() => unref(disabled));

  // Рефка на компонент списка
  const [reference, setReference] = useReference<TVirtualListRef>();

  const {
    bodyElement
  } = storeToRefs(uiStore);

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

    const item = reference.value?.scroller.$el.querySelector(`[data-index="${ index }"]`)?.parentElement;
    const itemRect = item.getBoundingClientRect();

    const fixedHeader = bodyElement.value.querySelector(CONTENT_LAYOUT_FIXED_HEADER_SELECTOR);
    const headerHeight = fixedHeader?.clientHeight || 0;

    // Разница, на которую нужно поправить скролл
    const finishingScroll = headerHeight - itemRect.top;

    bodyElement.value.scrollTop -= finishingScroll;
  };

  const preventScroll = ref<boolean>(unref(showRightSide));

  // Скроллим к элементу при изменении пути
  watch(() => route.path, (value, oldValue) => {
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
  }, {
    immediate: true,
    flush: 'post'
  });

  // Скроллим к элементу при изменении списка
  // например, при фильтрации или получении новых данных
  watch(items, (newItems, oldItems) => {
    const hasNewItems = newItems && newItems.length;
    const isOldItemsEmpty = !oldItems?.length;

    if (hasNewItems && isOldItemsEmpty) {
      scrollToPath(route.path);
    }
  }, { flush: 'post' });

  return {
    reference,
    setReference
  };
};
