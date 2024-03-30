import { type Ref, ref, toRaw, watch } from 'vue';

export function useLocalforageItem<T>(
  store: LocalForage,
  key: string,
  defaultValue: T,
) {
  const r = ref<T>(defaultValue) as Ref<T>;

  store.getItem<T>(key).then((value) => {
    if (value !== null) {
      r.value = value;
    }
  });

  watch(r, () => {
    store.setItem(key, toRaw(r.value)).then();
  });

  return r;
}
