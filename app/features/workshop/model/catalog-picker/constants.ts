/** Подписи поля и окна выбора записей раздела, как на new.ttg.club. */
export const CATALOG_PICKER_TEXT = {
  filters: 'Фильтры',
  sources: 'Источники',
  filtersHint:
    'Фильтры те же, что в разделе каталога: отберите нужное и выбирайте из короткого списка.',
  resetFilters: 'Сбросить фильтры',
  searchPlaceholder: 'Поиск по названию…',
  emptyTitle: 'Ничего не найдено',
  emptySubtitle: 'Измените запрос или сбросьте фильтры',
  errorTitle: 'Список не загрузился',
  retry: 'Повторить',
  remove: 'Убрать',
  cancel: 'Отмена',
  save: 'Готово',
  open: 'Выбрать',
  change: 'Изменить',
  clear: 'Очистить',
  allTab: 'Все',
  selectedTab: 'Выбранные',
  empty: 'Ничего не выбрано',
  emptySelectedSubtitle: 'Отметьте нужное на вкладке «Все»',
  emptySelectedSearchSubtitle: 'Среди выбранного такого нет',
  selectAll: 'Все',
  selectAllAction: 'Выбрать все',
  unselectAllAction: 'Снять все',
  showMore: 'Показать ещё',
  collapse: 'Свернуть',
  preview: 'Открыть описание',
} as const;

/** Значки поля и окна выбора. */
export const CATALOG_PICKER_ICON = {
  open: 'tabler:list-search',
  remove: 'tabler:x',
  filters: 'tabler:filter',
  sources: 'tabler:books',
  resetFilters: 'tabler:filter-off',
  search: 'tabler:search',
  loading: 'tabler:loader-2',
  error: 'tabler:alert-triangle',
  preview: 'tabler:layout-sidebar-right-expand',
  expand: 'tabler:chevron-down',
  collapse: 'tabler:chevron-up',
} as const;

/** Вкладки списка в окне: весь раздел или уже отмеченное. */
export const CATALOG_PICKER_VIEW = {
  all: 'all',
  selected: 'selected',
} as const;

/**
 * Сколько чипов выбранного поле показывает, пока их не развернули: без
 * предела набранный десяток выстраивается стеной и прячет форму.
 */
export const CATALOG_PICKER_CHIPS_LIMIT = 6;

/**
 * Насколько близко к концу списка нужно прокрутить, чтобы подгрузилась
 * следующая страница, в пикселях.
 */
export const CATALOG_PICKER_SCROLL_THRESHOLD_PX = 200;

/** Начало ключа данных окна: у списка окна свой кэш, не раздела. */
export const CATALOG_PICKER_DATA_KEY = 'workshop-catalog-picker';
