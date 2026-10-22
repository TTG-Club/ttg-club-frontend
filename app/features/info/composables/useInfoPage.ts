import type { MaybeRefOrGetter } from 'vue';

import { NOT_FOUND_STATUS } from '~/shared/consts';

import { INFO_API_PREFIX, infoPageSchema } from '../model';

/**
 * Информационная страница («О проекте», «Экспорт» и т.п.): грузится на
 * сервере, несуществующая отдаёт настоящую 404.
 * @param slug - адрес страницы после `/info/`
 */
export async function useInfoPage(slug: MaybeRefOrGetter<string>) {
  const { data, error } = await useAsyncData(
    () => `info-page:${toValue(slug)}`,
    async () =>
      infoPageSchema.parse(
        await $fetch(`${INFO_API_PREFIX}${encodeURIComponent(toValue(slug))}`),
      ),
    { deep: false },
  );

  const isNotFound = computed(
    () => error.value?.statusCode === NOT_FOUND_STATUS,
  );

  if (isNotFound.value) {
    throw createError({ statusCode: NOT_FOUND_STATUS, fatal: true });
  }

  watch(isNotFound, (value) => {
    if (value) {
      showError({ statusCode: NOT_FOUND_STATUS });
    }
  });

  const isError = computed(() => !!error.value);

  return { page: data, isError };
}
