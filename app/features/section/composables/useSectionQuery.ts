import type { LocationQuery, LocationQueryRaw } from 'vue-router';

import type { SectionQueryStore } from '../model';

import { mergeQuery } from '../model';

/**
 * Поиск и фильтр в адресе страницы: ссылкой на отфильтрованный список
 * можно поделиться.
 */
export function useRouteQueryStore(): SectionQueryStore {
  const route = useRoute();
  const router = useRouter();

  /**
   * Записывает изменения в адрес, не добавляя шаг в историю.
   * @param patch - изменения параметров
   */
  function update(patch: LocationQueryRaw) {
    router.replace({ query: { ...route.query, ...patch }, hash: route.hash });
  }

  return { query: computed(() => route.query), update };
}

/**
 * Поиск и фильтр в памяти: у списка во вкладке свои параметры, и адрес
 * страницы они не трогают.
 */
export function useLocalQueryStore(): SectionQueryStore {
  const query = shallowRef<LocationQuery>({});

  /**
   * Накладывает изменения на параметры списка.
   * @param patch - изменения параметров
   */
  function update(patch: LocationQueryRaw) {
    query.value = mergeQuery(query.value, patch);
  }

  return { query, update };
}
