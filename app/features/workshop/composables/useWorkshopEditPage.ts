import type { ComputedRef, Ref } from 'vue';

import { getErrorStatus } from '~user/model';

import { getRouteSlug, getWorkshopEditRoute, getWorkshopSlug } from '../model';

/** HTTP-статус «не найдено». */
const NOT_FOUND_STATUS = 404;

/** Настройки страницы правки. */
export interface WorkshopEditPageOptions<Entry> {
  /** Раздел мастерской в адресе страницы. */
  sectionKey: string;
  /** Читает запись по сегменту адреса. */
  fetchEntry: (slug: string) => Promise<unknown>;
  /** Разбирает ответ под редактор. */
  parse: (input: unknown) => Entry;
  /** Адрес записи строчными буквами, как у особенностей и богов. */
  isLowercaseSlug?: boolean;
}

/** Возвращаемое значение useWorkshopEditPage. */
export interface UseWorkshopEditPageReturn<Entry> {
  entry: Ref<Entry | undefined>;
  isLoading: Ref<boolean>;
  isNotFound: Ref<boolean>;
  isError: Ref<boolean>;
  /** Растёт после перечитывания: по нему пересоздаются форма и история. */
  version: Ref<number>;
  slug: ComputedRef<string>;
  /** Перечитывает запись с сервера. */
  reload: () => Promise<void>;
  /** После сохранения: перечитать или перейти на новый адрес. */
  handleSaved: (englishName: string) => Promise<void>;
}

/**
 * Страница правки записи мастерской. Запись читается только в браузере:
 * мастерская доступна после входа, и на сервере её открывать незачем.
 * @param options - раздел, загрузка и разбор записи
 */
export function useWorkshopEditPage<Entry>(
  options: WorkshopEditPageOptions<Entry>,
): UseWorkshopEditPageReturn<Entry> {
  const { sectionKey, fetchEntry, parse, isLowercaseSlug = false } = options;

  const route = useRoute();

  const entry = shallowRef<Entry>();
  const isLoading = ref(true);
  const isNotFound = ref(false);
  const isError = ref(false);
  const version = ref(0);

  const slug = computed(() => getRouteSlug(route.params.slug) ?? '');

  async function load(): Promise<void> {
    isLoading.value = true;
    isNotFound.value = false;
    isError.value = false;

    try {
      entry.value = parse(await fetchEntry(slug.value));
    } catch (error) {
      entry.value = undefined;

      if (getErrorStatus(error) === NOT_FOUND_STATUS) {
        isNotFound.value = true;
      } else {
        isError.value = true;
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function reload(): Promise<void> {
    await load();
    version.value += 1;
  }

  async function handleSaved(englishName: string): Promise<void> {
    const nextSlug = getWorkshopSlug(englishName, isLowercaseSlug);

    if (nextSlug === slug.value) {
      await reload();

      return;
    }

    await navigateTo(getWorkshopEditRoute(sectionKey, nextSlug), {
      replace: true,
    });
  }

  onMounted(load);

  watch(slug, () => {
    void reload();
  });

  return {
    entry,
    isLoading,
    isNotFound,
    isError,
    version,
    slug,
    reload,
    handleSaved,
  };
}

/**
 * После создания записи открывает её правку.
 * @param sectionKey - раздел мастерской в адресе
 * @param isLowercaseSlug - адрес записи строчными буквами
 */
export function useWorkshopCreatePage(
  sectionKey: string,
  isLowercaseSlug = false,
): (englishName: string) => Promise<void> {
  return async (englishName) => {
    await navigateTo(
      getWorkshopEditRoute(
        sectionKey,
        getWorkshopSlug(englishName, isLowercaseSlug),
      ),
    );
  };
}
