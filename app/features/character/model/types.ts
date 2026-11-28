import type { EntryName } from '~section/model';

import type {
  STARTING_EQUIPMENT_CATEGORIES,
  STARTING_EQUIPMENT_KINDS,
  STARTING_EQUIPMENT_SECTIONS,
} from './constants';
import type { TypedLink } from './schema';

/** Компонент заклинания в карточке: подпись и подсказка с правилом. */
export interface SpellComponentLabel {
  key: string;
  label: string;
  hint: string;
}

/** Ссылки одного типа книги: основные, UA, хомбрю. */
export interface TypedLinkGroup {
  name: string;
  items: Array<TypedLink>;
}

/** Свойство расы в колонке слева: подпись и значение. */
export interface RaceStat {
  key: string;
  label: string;
  value: string;
}

/** Раса или класс в списке: основные без группы, остальные в группах. */
export interface GroupedLink {
  name: EntryName;
  group?: { name: string; order: number } | null;
}

/** Вкладка страницы класса после разбора ответа API. */
export interface ClassTab {
  /** Ключ вкладки: тип и порядок, у двух вкладок особенностей типы совпадают. */
  key: string;
  name: string;
  /** Ручка фильтра, в которой скрыто выбран сам класс. */
  filterUrl: string;
}

/* --- Стартовое снаряжение класса ---------------------------------------- */

/** Вид позиции: предмет справочника (или свой) либо выбор из категории. */
export type StartingEquipmentKind = (typeof STARTING_EQUIPMENT_KINDS)[number];

/** Раздел справочника позиции. */
export type StartingEquipmentSection =
  (typeof STARTING_EQUIPMENT_SECTIONS)[number];

/** Категория позиции «на выбор»: «любое воинское оружие». */
export type StartingEquipmentCategory =
  (typeof STARTING_EQUIPMENT_CATEGORIES)[number];

/** Позиция варианта стартового снаряжения. */
export interface ClassStartingEquipmentItem {
  kind: StartingEquipmentKind;
  /** Раздел записи; null — свой предмет или выбор из категории. */
  section: StartingEquipmentSection | null;
  /** Адрес записи: `/weapons/longbow`; null — без записи. */
  url: string | null;
  /** Название на момент сохранения. */
  name: string;
  quantity: number;
  description: string | null;
  /** Категория выбора; только у позиции «на выбор». */
  category: StartingEquipmentCategory | null;
}

/** Вариант строки: набор позиций и монеты, зм. */
export interface ClassStartingEquipmentOption {
  items: Array<ClassStartingEquipmentItem>;
  coins: number | null;
}

/** Строка снаряжения: один вариант — без выбора, несколько — «а) … или б) …». */
export interface ClassStartingEquipmentLine {
  options: Array<ClassStartingEquipmentOption>;
}
