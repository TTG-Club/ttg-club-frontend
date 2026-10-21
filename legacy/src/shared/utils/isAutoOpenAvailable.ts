import { useUIStore } from '@/shared/stores/UIStore';

import type { MaybeRef } from '@vueuse/core';

export const isAutoOpenAvailable = <T>(
  list: MaybeRef<Array<T>>,
  inTab: MaybeRef<boolean> = false,
) => {
  const { fullscreen, isMobile } = storeToRefs(useUIStore());
  const unwrappedList = unref(list);
  const unwrappedInTab = unref(inTab);

  return (
    !unwrappedInTab &&
    !isMobile.value &&
    !fullscreen.value &&
    unwrappedList.length === 1
  );
};
