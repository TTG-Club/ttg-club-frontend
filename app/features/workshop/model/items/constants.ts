/** Ключ раздела снаряжения в мастерской. */
export const ITEMS_WORKSHOP_KEY = 'items';

/** Раздел справочника со снаряжением. */
export const ITEMS_REFERENCE_PATH = '/items';

/** Фильтры снаряжения: из них берутся категории. */
export const ITEMS_FILTER_PATH = '/api/v1/filters/items';

/** Группа фильтров с категориями снаряжения. */
export const ITEM_CATEGORIES_FILTER_KEY = 'category';

/** Подписи редактора снаряжения. */
export const ITEM_EDITOR_TEXT = {
  createTitle: 'Создание снаряжения',
  editTitle: 'Редактирование снаряжения',
  categories: 'Категории',
  created: 'Снаряжение создано',
  saved: 'Снаряжение обновлено',
  saveError: 'Не удалось сохранить снаряжение',
} as const;

/** Строки описания снаряжения в редакторе. */
export const ITEM_DESCRIPTION_ROWS = 10;
