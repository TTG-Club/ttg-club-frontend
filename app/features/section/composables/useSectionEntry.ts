import type { z } from 'zod';

import type { MaybeRefOrGetter } from 'vue';

import { NOT_FOUND_STATUS } from '~/shared/consts';

import { getEntryApiPath } from '../model';

interface SectionEntryOptions<T> {
  /** Ключ раздела для данных SSR. */
  key: string;
  /** Адрес страницы записи, например `/gods/Bane`. */
  path: MaybeRefOrGetter<string>;
  /** Проверка ответа ручки записи. */
  schema: z.ZodType<T>;
  /**
   * Запись открыта поверх списка, а не своей страницей: страница не ждёт её
   * загрузки, а отсутствующая запись показывает ошибку в панели, а не 404.
   */
  isEmbedded?: boolean;
}

/**
 * Запись раздела: грузится на сервере вместе со страницей и
 * перезагружается при переходе к соседней записи. Несуществующая запись
 * отдаёт страницу 404, чтобы поисковик не принял её за настоящую.
 * @param options - ключ раздела, адрес записи и проверка ответа
 */
export async function useSectionEntry<T>(options: SectionEntryOptions<T>) {
  const { data, status, error } = await useAsyncData(
    () => `section-entry-${options.key}:${toValue(options.path)}`,
    async () =>
      options.schema.parse(
        await $fetch(getEntryApiPath(toValue(options.path)), {
          method: 'POST',
        }),
      ),
    { deep: false, lazy: options.isEmbedded },
  );

  const isNotFound = computed(
    () => !options.isEmbedded && error.value?.statusCode === NOT_FOUND_STATUS,
  );

  if (isNotFound.value) {
    throw createError({ statusCode: NOT_FOUND_STATUS, fatal: true });
  }

  // Переход к удалённой записи без перезагрузки страницы.
  watch(isNotFound, (value) => {
    if (value) {
      showError({ statusCode: NOT_FOUND_STATUS });
    }
  });

  const isLoading = computed(() => status.value === 'pending');

  const isError = computed(() => status.value === 'error');

  return { entry: data, isLoading, isError };
}
