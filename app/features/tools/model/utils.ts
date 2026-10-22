import type { EntryName } from '~section/model';

import type { LootMagicItem, NameRace, TreasuryCoins } from './schema';
import type {
  EncounterRequest,
  LootGroup,
  LootView,
  NameComponent,
  NameGenerationType,
  NameRaceItem,
  NameSex,
  NamesRequest,
  Tavern,
  TavernBase,
  TavernField,
  TavernRequest,
  TavernSettings,
  TreasuryCoin,
} from './types';

import { clamp, mean, sample, uniq } from 'es-toolkit';

import {
  LOOT_TEXT,
  NAME_RACE_CHILD_CLASS,
  NAME_SHARED_HINT,
  TAVERN_HABITATS,
  TAVERN_PATH,
  TAVERN_SERVICE_LEVELS,
  TAVERN_TYPES,
  TAVERN_VISITORS_PATTERN,
  TOOL_COUNT_MAX,
  TOOL_COUNT_MIN,
  TREASURY_COINS,
} from './constants';

/**
 * Количество результатов в пределах, которые принимает бэкенд: больше 99 он
 * молча отдаёт пустой список.
 * @param count - значение из поля, может быть пустым
 */
export function normalizeToolCount(count: number | null | undefined): number {
  if (!count || !Number.isFinite(count)) {
    return TOOL_COUNT_MIN;
  }

  return clamp(Math.trunc(count), TOOL_COUNT_MIN, TOOL_COUNT_MAX);
}

/**
 * Переключает вариант, из которого нужен хотя бы один: книгу дикой магии,
 * пол или часть имени. Последний выбранный снять нельзя.
 * @param selected - выбранные варианты
 * @param value - вариант, по которому кликнули
 */
export function toggleRequired<T>(
  selected: ReadonlyArray<T>,
  value: T,
): Array<T> {
  if (!selected.includes(value)) {
    return [...selected, value];
  }

  return selected.length > 1
    ? selected.filter((item) => item !== value)
    : [...selected];
}

/**
 * Книга, выбранная по умолчанию: нужная, если она есть, иначе первая.
 * @param sources - книги с таблицами
 * @param preferred - книга по умолчанию
 */
export function getDefaultSources(
  sources: ReadonlyArray<string>,
  preferred: string,
): Array<string> {
  if (sources.includes(preferred)) {
    return [preferred];
  }

  const [first] = sources;

  return first ? [first] : [];
}

/**
 * Тело запроса столкновения без пустых полей.
 * @param level - средний уровень группы
 * @param environment - окружение
 */
export function buildEncounterRequest(
  level: number | undefined,
  environment: string | undefined,
): EncounterRequest {
  return {
    ...(level ? { level } : {}),
    ...(environment ? { environment } : {}),
  };
}

/**
 * Сортирует расы по названию, как в старом SPA.
 * @param races - расы
 */
function sortRacesByName(races: ReadonlyArray<NameRace>): Array<NameRace> {
  return [...races].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

/**
 * Группы списка рас для генератора имён. Расы без подрас идут первой группой.
 * Раса с подрасами открывает свою группу: если у неё есть свои имена, её
 * можно выбрать, а подрасы стоят с отступом, иначе она только заголовок.
 * @param races - расы из ручки
 */
export function buildNameRaceGroups(
  races: ReadonlyArray<NameRace>,
): Array<Array<NameRaceItem>> {
  const ids = new Set(races.map((race) => race.id));
  const children = new Map<number, Array<NameRace>>();
  const roots: Array<NameRace> = [];

  for (const race of sortRacesByName(races)) {
    if (race.parentId && ids.has(race.parentId)) {
      children.set(race.parentId, [
        ...(children.get(race.parentId) ?? []),
        race,
      ]);
    } else {
      roots.push(race);
    }
  }

  const single: Array<NameRaceItem> = [];
  const groups: Array<Array<NameRaceItem>> = [];

  for (const root of roots) {
    const subraces = (children.get(root.id) ?? []).filter(
      (race) => race.available,
    );

    if (!subraces.length) {
      if (root.available) {
        single.push({ label: root.name, value: root.id });
      }

      continue;
    }

    const head: NameRaceItem = root.available
      ? { label: root.name, value: root.id }
      : { label: root.name, type: 'label' };

    const childClass = root.available ? NAME_RACE_CHILD_CLASS : undefined;

    groups.push([
      head,
      ...subraces.map((race) => ({
        label: race.name,
        value: race.id,
        ...(childClass ? { class: childClass } : {}),
      })),
    ]);
  }

  return single.length ? [single, ...groups] : groups;
}

/**
 * Подсказка для генерации с общей частью имени, у остальных её нет.
 * @param type - вид генерации
 */
export function getNameSharedHint(
  type: NameGenerationType,
): string | undefined {
  const hints: Partial<Record<NameGenerationType, string>> = NAME_SHARED_HINT;

  return hints[type];
}

/**
 * Тело запроса имён. Один персонаж — всегда одно имя, пустой список рас
 * значит любую расу.
 * @param options - настройки формы
 * @param options.type - вид генерации
 * @param options.components - части имени
 * @param options.count - сколько имён
 * @param options.raceIds - выбранные расы
 * @param options.sexes - выбранный пол
 */
export function buildNamesRequest(options: {
  type: NameGenerationType;
  components: ReadonlyArray<NameComponent>;
  count: number | null | undefined;
  raceIds: ReadonlyArray<number>;
  sexes: ReadonlyArray<NameSex>;
}): NamesRequest {
  return {
    type: options.type,
    components: [...options.components],
    count: options.type === 'SINGLE' ? 1 : normalizeToolCount(options.count),
    raceIds: options.raceIds.length ? [...options.raceIds] : null,
    sexes: [...options.sexes],
  };
}

/**
 * Число из цены: бэкенд отдаёт цену строкой, у артефактов её нет.
 * @param value - цена из ответа
 */
export function parseLootPrice(
  value: string | number | null | undefined,
): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const price = Number(value);

  return Number.isFinite(price) ? price : undefined;
}

/**
 * Цена товара по выбранной книге: DMG или XGE.
 * @param item - магический предмет
 * @param source - сокращение книги с ценами
 */
export function getTraderPrice(
  item: LootMagicItem,
  source: string | undefined,
): number | undefined {
  if (!source) {
    return undefined;
  }

  return parseLootPrice(item.price?.[source.toLowerCase()]);
}

/**
 * Добыча строками списка. С группировкой одинаковые по названию предметы
 * сливаются в одну строку с количеством; цена строки — средняя или
 * наибольшая из разных цен, как в старом SPA.
 * @param items - добыча в порядке ответа
 * @param getPrice - цена одного предмета
 * @param view - группировать ли и какую цену брать
 */
export function groupLoot<T extends { name: EntryName }>(
  items: ReadonlyArray<T>,
  getPrice: (item: T) => number | undefined,
  view: LootView,
): Array<LootGroup<T>> {
  if (!view.isGrouped) {
    return items.map((item) => ({ item, count: 1, price: getPrice(item) }));
  }

  const groups = new Map<string, Array<T>>();

  for (const item of items) {
    const group = groups.get(item.name.rus);

    if (group) {
      group.push(item);
    } else {
      groups.set(item.name.rus, [item]);
    }
  }

  return [...groups.values()].flatMap((group) => {
    const [item] = group;

    if (!item) {
      return [];
    }

    const prices = uniq(
      group
        .map(getPrice)
        .filter((price): price is number => price !== undefined),
    );

    return [
      {
        item,
        count: group.length,
        price: getGroupPrice(prices, view.isMaxPrice),
      },
    ];
  });
}

/**
 * Цена группы одинаковых предметов.
 * @param prices - разные цены группы
 * @param isMax - брать наибольшую, а не среднюю
 */
function getGroupPrice(
  prices: ReadonlyArray<number>,
  isMax: boolean,
): number | undefined {
  if (!prices.length) {
    return undefined;
  }

  return isMax ? Math.max(...prices) : Math.round(mean([...prices]));
}

/**
 * Цена в золотых с разрядами: «12 500 зм».
 * @param price - цена
 */
export function formatLootPrice(price: number): string {
  return `${price.toLocaleString('ru-RU')} ${LOOT_TEXT.currency}`;
}

/**
 * Количество одинаковых предметов, «×3»; у одиночного — ничего.
 * @param count - сколько предметов в строке
 */
export function getLootCountLabel(count: number): string | undefined {
  return count > 1 ? `${LOOT_TEXT.countPrefix}${count}` : undefined;
}

/**
 * Монеты сокровищницы по порядку; нет монеты — ноль, как в старом SPA.
 * @param coins - монеты из ответа
 */
export function getTreasuryCoins(coins: TreasuryCoins): Array<TreasuryCoin> {
  return TREASURY_COINS.map((coin) => ({
    key: coin.key,
    value: coins[coin.key] ?? 0,
    label: `${(coins[coin.key] ?? 0).toLocaleString('ru-RU')} ${coin.unit}`,
  }));
}

/**
 * Дополняет настройки таверны случайными значениями там, где ничего не
 * выбрано: так метки на карточке и запросы частей совпадают.
 * @param selected - выбранные настройки
 */
export function resolveTavernSettings(
  selected: Partial<TavernSettings>,
): TavernSettings {
  return {
    type: selected.type ?? sample(TAVERN_TYPES).value,
    habitat: selected.habitat ?? sample(TAVERN_HABITATS).value,
    serviceLevel: selected.serviceLevel ?? sample(TAVERN_SERVICE_LEVELS).value,
  };
}

/**
 * Заполненность зала из HTML атмосферы; без метки зал пустой.
 * @param html - HTML атмосферы
 */
export function parseTavernVisitors(html: string): number {
  const [, visitors] = TAVERN_VISITORS_PATTERN.exec(html) ?? [];

  return Number(visitors ?? 0);
}

/**
 * Ручка и параметры одной части таверны.
 * @param field - часть таверны
 * @param tavern - настройки и заполненность зала
 */
export function getTavernRequest(
  field: TavernField,
  tavern: TavernBase,
): TavernRequest {
  const { type, habitat, serviceLevel, visitors } = tavern;

  const queries: Record<TavernField, TavernRequest['query']> = {
    name: { tavernaType: type },
    menu: { tavernaType: type, habitat, serviceLevel },
    atmosphere: {},
    rumors: { atmosphereVisitors: visitors },
    event: { atmosphereVisitors: visitors },
    tables: {
      tavernaType: type,
      atmosphereVisitors: visitors,
      serviceLevel,
      habitat,
    },
    bartender: { habitat },
  };

  return { path: TAVERN_PATH[field], query: queries[field] };
}

/**
 * Таверна с новой частью; новая атмосфера меняет и заполненность зала.
 * @param tavern - таверна
 * @param field - обновлённая часть
 * @param html - её HTML
 */
export function patchTavern(
  tavern: Tavern,
  field: TavernField,
  html: string,
): Tavern {
  const patched: Tavern = { ...tavern };

  patched[field] = html;

  if (field === 'atmosphere') {
    patched.visitors = parseTavernVisitors(html);
  }

  return patched;
}

/**
 * Метки карточки таверны: тип, территория и уровень обслуживания.
 * @param settings - настройки таверны
 */
export function getTavernTags(settings: TavernSettings): Array<string> {
  return [
    TAVERN_TYPES.find((item) => item.value === settings.type)?.short,
    TAVERN_HABITATS.find((item) => item.value === settings.habitat)?.label,
    TAVERN_SERVICE_LEVELS.find((item) => item.value === settings.serviceLevel)
      ?.label,
  ].filter((label) => label !== undefined);
}
