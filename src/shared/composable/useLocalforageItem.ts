import { debounce } from 'lodash-es';

import type { Ref } from 'vue';

export function useLocalforageItem<T>(
  store: LocalForage,
  key: string,
  defaultValue: T,
) {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const r = ref<T>(defaultValue) as Ref<T>;

  store.getItem<T>(key).then((value) => {
    if (value !== null) {
      r.value = value;
    }
  });

  watch(
    r,
    debounce(() => {
      store.setItem(key, toRaw(r.value)).then();
    }, 50),
    { deep: true },
  );

  return r;
}
