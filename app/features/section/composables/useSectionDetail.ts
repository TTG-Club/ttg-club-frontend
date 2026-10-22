import {
  getDetailPath,
  getDetailSlug,
  getQueryString,
  SECTION_DETAIL_QUERY_KEY,
} from '../model';

/**
 * Открытая запись раздела в двух режимах, как на new.ttg.club. В широком
 * запись стоит рядом со списком и хранится в `?detail=`, в обычном
 * открывается дровером без смены адреса, а на телефоне — своей страницей.
 * @param sectionPath - адрес раздела, например `/spells`
 */
export async function useSectionDetail(sectionPath: string) {
  const route = useRoute();
  const router = useRouter();
  const { isSplitActive, isDrawerAvailable } = useLayoutWidth();

  const detailSlug = computed(() =>
    getQueryString(route.query[SECTION_DETAIL_QUERY_KEY]),
  );

  /** Запись в панели рядом со списком. */
  const detailPath = computed(() =>
    isSplitActive.value
      ? getDetailPath(sectionPath, detailSlug.value)
      : undefined,
  );

  const drawerPath = ref<string>();
  const isDrawerOpen = ref(false);

  /** Пользователь закрыл панель: первая запись больше не выбирается сама. */
  const isDismissed = ref(false);

  const activePath = computed(() => {
    if (isSplitActive.value) {
      return detailPath.value;
    }

    return isDrawerOpen.value ? drawerPath.value : undefined;
  });

  // Ссылка из широкого режима, открытая в обычном: сразу страница записи
  if (import.meta.server && !isSplitActive.value && detailSlug.value) {
    const path = getDetailPath(sectionPath, detailSlug.value);

    if (path) {
      await navigateTo(path, { replace: true, redirectCode: 302 });
    }
  }

  /**
   * Подставляет запись в `?detail=`.
   * @param slug - запись или `undefined`, чтобы закрыть панель
   * @param isReplace - без новой записи в истории
   */
  function setDetail(slug: string | undefined, isReplace = false) {
    const location = {
      query: { ...route.query, [SECTION_DETAIL_QUERY_KEY]: slug },
    };

    return isReplace ? router.replace(location) : router.push(location);
  }

  /**
   * Открывает запись так, как велит режим.
   * @param path - адрес записи
   */
  function open(path: string): void {
    if (isSplitActive.value) {
      setDetail(getDetailSlug(sectionPath, path));

      return;
    }

    if (!isDrawerAvailable.value) {
      navigateTo(path);

      return;
    }

    drawerPath.value = path;
    isDrawerOpen.value = true;
  }

  /** Закрывает запись так, как велит режим. */
  function close(): void {
    if (isSplitActive.value) {
      setDetail(undefined);

      return;
    }

    isDrawerOpen.value = false;
  }

  /**
   * Выбирает первую запись списка, пока панель пуста и её не закрывали.
   * @param path - адрес первой записи
   */
  function selectFirst(path: string | undefined): void {
    if (
      !path
      || !isSplitActive.value
      || detailSlug.value
      || isDismissed.value
    ) {
      return;
    }

    setDetail(getDetailSlug(sectionPath, path), true);
  }

  // Панель закрыли в широком режиме; уход в обычный режим её не закрывает
  watch(detailSlug, (value, previous) => {
    isDismissed.value = isSplitActive.value && !value && !!previous;
  });

  // В обычном режиме `?detail=` не нужен
  watch(isSplitActive, (value) => {
    if (!value && detailSlug.value) {
      setDetail(undefined, true);
    }
  });

  return {
    isSplitActive,
    detailPath,
    drawerPath,
    isDrawerOpen,
    isDismissed,
    activePath,
    open,
    close,
    selectFirst,
  };
}
