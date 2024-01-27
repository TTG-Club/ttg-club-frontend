import { storeToRefs } from 'pinia';
import { unref } from 'vue';

import { useUIStore } from '@/shared/stores/UIStore';

import type { MaybeRef } from '@vueuse/core';

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
