import type { SelectOption } from '../types';

/** Ключ раздела доспехов в мастерской. */
export const ARMORS_WORKSHOP_KEY = 'armors';

/** Раздел справочника с доспехами. */
export const ARMORS_REFERENCE_PATH = '/armors';

/** Категории доспехов. */
export const ARMOR_TYPE_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Лёгкий доспех', value: 'LIGHT' },
  { label: 'Средний доспех', value: 'MEDIUM' },
  { label: 'Тяжёлый доспех', value: 'HEAVY' },
  { label: 'Щит', value: 'SHIELD' },
];

/** Значения нового доспеха, как в старом SPA. */
export const ARMOR_DEFAULT = {
  type: 'LIGHT',
  armorClass: 10,
} as const;

/** Подписи редактора доспехов. */
export const ARMOR_EDITOR_TEXT = {
  createTitle: 'Создание доспеха',
  editTitle: 'Редактирование доспеха',
  armorClass: 'Класс доспеха',
  cost: 'Цена, зм',
  forceRequirements: 'Требование Силы',
  stealthHindrance: 'Помеха к Скрытности',
  created: 'Доспех создан',
  saved: 'Доспех обновлён',
  saveError: 'Не удалось сохранить доспех',
} as const;

/** Строки описания доспеха в редакторе. */
export const ARMOR_DESCRIPTION_ROWS = 10;
