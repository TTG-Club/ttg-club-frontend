import { storeToRefs } from 'pinia';
import { unref } from 'vue';

import type { MaybeRef } from '@vueuse/core';

import { useUIStore } from '@/store/UI/UIStore';

export const isAutoOpenAvailable = <T extends Array<unknown>>(
  list: MaybeRef<T>,
  inTab: MaybeRef<boolean> = false
) => {
  const { fullscreen, isMobile } = storeToRefs(useUIStore());
  const unwrappedList = unref<T>(list);
  const unwrappedInTab = unref(inTab);

  return (
    !unwrappedInTab &&
    !isMobile.value &&
    !fullscreen.value &&
    unwrappedList.length === 1
  );
};
