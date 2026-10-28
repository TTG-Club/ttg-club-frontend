import type { SelectOption } from '../types';

/** Ключ раздела оружия в мастерской. */
export const WEAPONS_WORKSHOP_KEY = 'weapons';

/** Раздел справочника с оружием. */
export const WEAPONS_REFERENCE_PATH = '/weapons';

/** Фильтры оружия: из них берутся свойства. */
export const WEAPONS_FILTER_PATH = '/api/v1/filters/weapons';

/** Группа фильтров со свойствами оружия (ключ так и пишется на бэкенде). */
export const WEAPON_PROPERTIES_FILTER_KEY = 'properrty';

/** Виды оружия. */
export const WEAPON_TYPE_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Простое рукопашное', value: 'SIMPLE_MELE' },
  { label: 'Простое дальнобойное', value: 'SIMPLE_RANGED' },
  { label: 'Воинское рукопашное', value: 'WAR_MELE' },
  { label: 'Воинское дальнобойное', value: 'WAR_RANGED' },
  { label: 'Экзотическое рукопашное', value: 'EXOTIC_MELE' },
  { label: 'Экзотическое дальнобойное', value: 'EXOTIC_RANGED' },
];

/** Типы урона оружия. */
export const WEAPON_DAMAGE_TYPE_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Дробящий', value: 'BLUDGEONING' },
  { label: 'Колющий', value: 'PIERCING' },
  { label: 'Рубящий', value: 'SLASHING' },
  { label: 'Без урона', value: 'NO_DAMAGE' },
];

/** Кости урона. */
export const WEAPON_DICE_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'к4', value: 'd4' },
  { label: 'к6', value: 'd6' },
  { label: 'к8', value: 'd8' },
  { label: 'к10', value: 'd10' },
  { label: 'к12', value: 'd12' },
  { label: 'к20', value: 'd20' },
];

/** Значения нового оружия, как в старом SPA. */
export const WEAPON_DEFAULT = {
  type: 'SIMPLE_MELE',
  damageType: 'BLUDGEONING',
  damageDice: 'd6',
  numberDice: 1,
} as const;

/** Подписи редактора оружия. */
export const WEAPON_EDITOR_TEXT = {
  createTitle: 'Создание оружия',
  editTitle: 'Редактирование оружия',
  damageType: 'Тип урона',
  numberDice: 'Количество костей',
  damageDice: 'Кость урона',
  twoHandDamageDice: 'Кость двуручного хвата',
  twoHandHelp: 'Для универсального оружия',
  minDistance: 'Нормальная дистанция',
  maxDistance: 'Максимальная дистанция',
  distanceHelp: 'В футах',
  ammo: 'Боеприпасы',
  properties: 'Свойства',
  special: 'Особое',
  created: 'Оружие создано',
  saved: 'Оружие обновлено',
  saveError: 'Не удалось сохранить оружие',
} as const;

/** Строки описаний оружия в редакторе. */
export const WEAPON_DESCRIPTION_ROWS = 8;

export const WEAPON_SPECIAL_ROWS = 5;
