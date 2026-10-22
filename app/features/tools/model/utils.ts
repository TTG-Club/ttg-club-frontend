import type { NameRace } from './schema';
import type {
  EncounterRequest,
  NameComponent,
  NameGenerationType,
  NameRaceItem,
  NameSex,
  NamesRequest,
} from './types';

import { clamp } from 'es-toolkit';

import {
  NAME_RACE_CHILD_CLASS,
  NAME_SHARED_HINT,
  TOOL_COUNT_MAX,
  TOOL_COUNT_MIN,
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
