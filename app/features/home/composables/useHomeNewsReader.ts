import type { AsyncDataRequestStatus } from '#app';
import type { ComputedRef, Ref } from 'vue';

/** Состояние блока новостей на главной. */
interface HomeNewsReader {
  /** Первая загрузка ещё идёт — показывать скелетон */
  isLoading: ComputedRef<boolean>;
  /** Открыта ли панель чтения */
  isDrawerOpen: Ref<boolean>;
  /** Слаг новости в панели чтения */
  openedUrl: Ref<string>;
  /** Открывает новость в панели чтения */
  open: (url: string) => void;
}

/**
 * Общее поведение блоков новостей на главной: скелетон на первой загрузке,
 * обновление при возврате на вкладку и панель чтения открытой новости.
 *
 * @param newsList - загруженные новости
 * @param status - состояние запроса
 * @param refresh - повторный запрос
 * @returns состояние загрузки и панели чтения
 */
export function useHomeNewsReader(
  newsList: Ref<ReadonlyArray<unknown>>,
  status: Ref<AsyncDataRequestStatus>,
  refresh: () => Promise<void>,
): HomeNewsReader {
  // Главную часто держат открытой, а новости публикуют на новом сайте —
  // нередко в соседней вкладке. Вернулись на вкладку — подтягиваем свежее
  const visibility = useDocumentVisibility();

  watch(visibility, (state, previous) => {
    if (state === 'visible' && previous === 'hidden') {
      refresh();
    }
  });

  // Скелетон — только пока данных ещё нет; idle тоже считаем загрузкой
  // (server: false — до клиентского запроса статус idle). Фоновое обновление
  // не мигает скелетоном поверх показанных новостей
  const isLoading = computed(
    () =>
      (status.value === 'pending' || status.value === 'idle')
      && !newsList.value.length,
  );

  const isDrawerOpen = ref(false);

  /** Слаг новости в панели; остаётся после закрытия, чтобы панель не мигала */
  const openedUrl = ref('');

  /**
   * Открывает новость в панели чтения.
   *
   * @param url - слаг новости
   */
  function open(url: string): void {
    openedUrl.value = url;
    isDrawerOpen.value = true;
  }

  return { isLoading, isDrawerOpen, openedUrl, open };
}
