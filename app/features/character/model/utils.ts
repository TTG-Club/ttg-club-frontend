import type { LocationQueryRaw } from 'vue-router';
import type { FilterDefinition } from '~section/model';

import type {
  ArchetypeSpell,
  ArchetypeSpellTable,
  BackgroundDetail,
  ClassDetail,
  ClassFeature,
  ClassLink,
  ClassTraits,
  RaceAbility,
  RaceDetail,
  RaceSpeed,
  SpellComponents,
  SpellDetail,
  TypedLink,
} from './schema';
import type {
  ClassTab,
  GroupedLink,
  RaceStat,
  SpellComponentLabel,
  TypedLinkGroup,
} from './types';

import { sortBy } from 'es-toolkit';

import {
  getEntryApiPath,
  getFilterGroups,
  QUERY_VALUES_SEPARATOR,
  WORKSHOP_EDIT_SUFFIX,
} from '~section/model';

import {
  ABILITIES_COUNT,
  ARCHETYPE_SPELL_LEVEL_TYPE,
  CHARACTER_LIST_SEPARATOR,
  CHARACTER_NO_REQUIREMENTS,
  CLASS_HIT_DICE_PREFIX,
  CLASS_ICON_COLLECTION_PREFIX,
  CLASS_ICON_PREFIX,
  CLASS_ICONS,
  CLASS_TAB_TYPE,
  CLASS_TEXT,
  FEAT_TEXT,
  OPTION_CLASS_FILTER_KEY,
  OPTIONS_SECTION,
  RACE_STATS,
  RACE_TEXT,
  RACES_WORKSHOP_PATH,
  REFERENCE_SEPARATOR,
  SKILLS_COUNT,
  SPELL_CLASS_FILTER_KEY,
  SPELL_COMPONENTS,
  SPELL_TEXT,
  SPELLS_SECTION,
} from './constants';

/**
 * Подпись требований черты или особенности для плашки источника.
 * @param requirements - требования из API
 */
export function getRequirementsLabel(requirements?: string | null): string {
  return `${FEAT_TEXT.requirements} ${requirements || CHARACTER_NO_REQUIREMENTS}`;
}

/**
 * Языки предыстории: списком, а у старых записей — одной строкой.
 * @param background - предыстория
 */
export function getBackgroundLanguages(background: BackgroundDetail): string {
  return background.languages?.length
    ? background.languages.join(CHARACTER_LIST_SEPARATOR)
    : (background.language ?? '');
}

/**
 * Есть ли у предыстории блок персонализации: текст или таблицы.
 * @param background - предыстория
 */
export function hasPersonalization(background: BackgroundDetail): boolean {
  return Boolean(
    background.personalization || background.personalizationTables?.length,
  );
}

/**
 * Группа заклинания в списке: «Заговоры» или «3 уровень».
 * @param spell - заклинание из списка
 * @param spell.level - круг заклинания, 0 — заговор
 */
export function getSpellGroup(spell: { level: number }): string {
  return spell.level
    ? `${spell.level} ${SPELL_TEXT.level}`
    : SPELL_TEXT.cantrips;
}

/**
 * Подпись заклинания в плашке источника:
 * «3 уровень, воплощение [огонь] (ритуал)».
 * @param spell - заклинание
 */
export function getSpellTypeLabel(spell: SpellDetail): string {
  const level = spell.level
    ? `${spell.level} ${SPELL_TEXT.level}`
    : SPELL_TEXT.cantripLower;

  const additional = spell.additionalType ? ` [${spell.additionalType}]` : '';
  const ritual = spell.ritual ? ` (${SPELL_TEXT.ritual})` : '';

  return `${level}, ${spell.school}${additional}${ritual}`;
}

/**
 * Компоненты заклинания для карточки: только те, что есть, а у
 * материального — его описание в скобках.
 * @param components - компоненты из API
 */
export function getSpellComponentLabels(
  components?: SpellComponents | null,
): SpellComponentLabel[] {
  return SPELL_COMPONENTS.flatMap((component) => {
    const value = components?.[component.key];

    if (!value) {
      return [];
    }

    const detail = typeof value === 'string' ? ` (${value})` : '';

    return [
      {
        key: component.key,
        label: `${component.name}${detail}`,
        hint: component.hint,
      },
    ];
  });
}

/**
 * Бонусы расы к характеристикам: «СИЛ +2, ТЕЛ +1» или выбор по названию.
 * В списке бонус ко всем шести пишется одной фразой.
 * @param abilities - бонусы из API
 * @param isShort - короткая подпись для карточки списка
 */
export function getRaceAbilitiesLabel(
  abilities?: Array<RaceAbility> | null,
  isShort = false,
): string {
  if (!abilities?.length) {
    return '';
  }

  if (isShort && abilities.length === ABILITIES_COUNT) {
    return RACE_TEXT.everyAbility;
  }

  return abilities
    .map(({ name, shortName, value }) => {
      if (!value) {
        return name;
      }

      return `${shortName ?? name} ${value > 0 ? `+${value}` : value}`;
    })
    .join(CHARACTER_LIST_SEPARATOR);
}

/**
 * Скорости расы: «30 фт., летая 50 фт.».
 * @param speed - скорости из API
 */
export function getRaceSpeedLabel(speed?: Array<RaceSpeed> | null): string {
  return (speed ?? [])
    .map(({ name, value }) =>
      [name, value, RACE_TEXT.feet].filter(Boolean).join(' '),
    )
    .join(CHARACTER_LIST_SEPARATOR);
}

/**
 * Свойства расы для колонки слева; пустые не показываются.
 * @param race - раса
 */
export function getRaceStats(race: RaceDetail): Array<RaceStat> {
  const stats: Array<RaceStat> = [
    { key: 'type', label: RACE_STATS.type, value: race.type ?? '' },
    {
      key: 'abilities',
      label: RACE_STATS.abilities,
      value: getRaceAbilitiesLabel(race.abilities),
    },
    { key: 'size', label: RACE_STATS.size, value: race.size ?? '' },
    {
      key: 'speed',
      label: RACE_STATS.speed,
      value: getRaceSpeedLabel(race.speed),
    },
  ];

  if (race.darkvision) {
    stats.push({
      key: 'darkvision',
      label: RACE_STATS.darkvision,
      value: `${race.darkvision} ${RACE_TEXT.feet}`,
    });
  }

  return stats.filter(({ value }) => Boolean(value));
}

/**
 * Порядок рас и классов как в старом SPA: сначала основные по алфавиту,
 * затем группы (происхождения, UA, хомбрю…) по их порядку.
 * @param entries - расы или классы из списка
 */
export function sortByGroup<T extends GroupedLink>(
  entries: Array<T>,
): Array<T> {
  return sortBy(entries, [
    (entry) => (entry.group ? entry.group.order + 1 : 0),
    (entry) => entry.name.rus,
  ]);
}

/**
 * Классы в поиске, как на new.ttg.club: класс, найденный по своему
 * названию, остаётся карточкой со всеми архетипами, а у остальных ручка
 * нашла архетипы, и они встают отдельными карточками на место класса с его
 * обложкой, значком и группой.
 * @param classes - классы из списка
 * @param search - строка поиска
 */
export function expandClassSearch(
  classes: Array<ClassLink>,
  search: string,
): Array<ClassLink> {
  const term = search.trim().toLocaleLowerCase();

  if (!term) {
    return classes;
  }

  return classes.flatMap((item) => {
    const isClassFound = [item.name.rus, item.name.eng].some((name) =>
      name.toLocaleLowerCase().includes(term),
    );

    if (isClassFound || !item.archetypes?.length) {
      return [item];
    }

    return item.archetypes.map((archetype) => ({
      ...item,
      name: archetype.name,
      url: archetype.url,
      source: archetype.source ?? item.source,
      archetypes: [],
    }));
  });
}

/**
 * Группа расы или класса в списке; у основных подписи нет.
 * @param entry - раса или класс
 */
export function getGroupName(entry: GroupedLink): string {
  return entry.group?.name ?? '';
}

/**
 * Разновидности расы или архетипы класса, разбитые по типу книги в его
 * порядке.
 * @param links - ссылки из списка
 */
export function groupByBookType(
  links?: Array<TypedLink> | null,
): Array<TypedLinkGroup> {
  const groups = new Map<string, TypedLinkGroup & { order: number }>();

  for (const link of links ?? []) {
    const group = groups.get(link.type.name) ?? {
      name: link.type.name,
      order: link.type.order,
      items: [],
    };

    group.items.push(link);
    groups.set(link.type.name, group);
  }

  return sortBy([...groups.values()], [(group) => group.order]).map(
    ({ name, items }) => ({ name, items }),
  );
}

/**
 * Адреса разновидностей или архетипов в том порядке, в каком их видно в
 * выборе варианта: по типу книги.
 * @param links - ссылки на варианты
 */
function getBookTypePaths(links?: Array<TypedLink> | null): Array<string> {
  return groupByBookType(links).flatMap((group) =>
    group.items.map((link) => link.url),
  );
}

/**
 * Что листать свайпом со страницы архетипа: соседние архетипы того же
 * класса. У самого класса своего порядка нет — он листает список классов.
 * @param entry - класс или архетип
 * @param path - адрес открытой записи
 */
export function getArchetypeSwipePaths(
  entry: ClassDetail,
  path: string,
): Array<string> | undefined {
  return findClassArchetype(entry, path)
    ? getBookTypePaths(entry.archetypes)
    : undefined;
}

/**
 * Что листать свайпом со страницы разновидности: соседние разновидности
 * той же расы. У основной расы своего порядка нет — она листает список рас.
 * @param race - раса или разновидность
 * @param path - адрес открытой записи
 */
export function getSubraceSwipePaths(
  race: RaceDetail,
  path: string,
): Array<string> | undefined {
  const subraces = race.baseRace?.subraces;

  return subraces?.some((subrace) => subrace.url === path)
    ? getBookTypePaths(subraces)
    : undefined;
}

/**
 * Особенности расы в порядке старого SPA: сначала свёрнутые, особенности
 * разновидности — после особенностей самой расы.
 * @param race - раса
 */
export function sortRaceSkills(race: RaceDetail): RaceDetail['skills'] {
  return sortBy(race.skills ?? [], [
    (skill) => Boolean(skill.opened),
    (skill) => !skill.subrace,
  ]);
}

/**
 * Страница правки расы или разновидности в мастерской:
 * `/races/elf/high` правится на `/workshop/races/high/edit`.
 * @param path - адрес расы на сайте
 */
export function getRaceEditPath(path: string): string {
  const slug = path.split('/').at(-1) ?? '';

  return `${RACES_WORKSHOP_PATH}/${slug}${WORKSHOP_EDIT_SUFFIX}`;
}

/**
 * Значок класса из коллекции `ttg`; у классов без своего значка его нет.
 * @param icon - значок из API, например `class/wizard`
 */
export function getClassIcon(icon?: string | null): string | undefined {
  if (!icon?.startsWith(CLASS_ICON_PREFIX)) {
    return undefined;
  }

  const name = icon.slice(CLASS_ICON_PREFIX.length);

  return CLASS_ICONS.has(name)
    ? `${CLASS_ICON_COLLECTION_PREFIX}${name}`
    : undefined;
}

/**
 * Особенности класса (воззвания, манёвры…) по порядку: у класса и его
 * архетипа их может быть две. Ключ собирается из типа и порядка, а ручка
 * фильтра выбирает особенности класса.
 * @param entry - класс или архетип
 */
export function getClassOptionTabs(entry: ClassDetail): Array<ClassTab> {
  return sortBy(
    (entry.tabs ?? []).filter((tab) => tab.type === CLASS_TAB_TYPE.options),
    [(tab) => tab.order],
  ).map((tab) => ({
    key: `${tab.type}-${tab.order}`,
    name: tab.name,
    filterUrl: getEntryApiPath(tab.url),
  }));
}

/**
 * Ручка фильтра заклинаний класса: в нём скрыто выбран сам класс. У
 * класса без заклинаний её нет.
 * @param entry - класс или архетип
 */
export function getClassSpellsFilterUrl(
  entry: ClassDetail,
): string | undefined {
  const tab = entry.tabs?.find((item) => item.type === CLASS_TAB_TYPE.spells);

  return tab ? getEntryApiPath(tab.url) : undefined;
}

/**
 * Ссылка на раздел с фильтром класса: значения скрытой группы фильтра
 * класса подставляются в адрес раздела.
 * @param filter - фильтр класса
 * @param key - группа, которая выбирает класс
 * @param path - адрес раздела
 */
function getClassFilterLink(
  filter: FilterDefinition,
  key: string,
  path: string,
): { path: string; query: LocationQueryRaw } | undefined {
  const group = getFilterGroups(filter).find(
    (item) => item.key === key && item.values.length,
  );

  return group
    ? {
        path,
        query: {
          [group.key]: group.values
            .map((value) => String(value.key))
            .join(QUERY_VALUES_SEPARATOR),
        },
      }
    : undefined;
}

/**
 * Ссылка на раздел заклинаний с фильтром класса. Класс берётся из фильтра
 * класса: у Мистического рыцаря и Мистического ловкача это Волшебник.
 * @param filter - фильтр заклинаний класса
 */
export function getClassSpellsLink(filter: FilterDefinition) {
  return getClassFilterLink(
    filter,
    SPELL_CLASS_FILTER_KEY,
    SPELLS_SECTION.path,
  );
}

/**
 * Ссылка на раздел особенностей с особенностями класса, например
 * воззваниями колдуна.
 * @param filter - фильтр особенностей класса
 */
export function getClassOptionsLink(filter: FilterDefinition) {
  return getClassFilterLink(
    filter,
    OPTION_CLASS_FILTER_KEY,
    OPTIONS_SECTION.path,
  );
}

/**
 * Архетип, открытый сейчас. Архетип приходит с адресом и архетипами
 * своего класса, поэтому узнаётся по адресу страницы.
 * @param entry - класс или архетип
 * @param path - адрес открытой записи
 */
export function findClassArchetype(
  entry: ClassDetail,
  path: string,
): TypedLink | undefined {
  return path === entry.url
    ? undefined
    : entry.archetypes?.find((archetype) => archetype.url === path);
}

/**
 * Название класса у архетипа: API склеивает его с названием архетипа.
 * @param entry - класс или архетип
 * @param archetype - открытый архетип
 */
export function getParentClassName(
  entry: ClassDetail,
  archetype?: TypedLink,
): string {
  const suffix = archetype ? ` ${archetype.name.rus}` : '';

  return suffix && entry.name.rus.endsWith(suffix)
    ? entry.name.rus.slice(0, -suffix.length)
    : entry.name.rus;
}

/**
 * Кость хитов и среднее значение для хитов на следующих уровнях.
 * @param diceHp - грани кости хитов
 */
export function getClassHitPoints(diceHp: number): {
  formula: string;
  average: number;
} {
  return {
    formula: `${CLASS_HIT_DICE_PREFIX}${diceHp}`,
    average: Math.floor(diceHp / 2) + 1,
  };
}

/**
 * Подпись выбора навыков: из всех — одной фразой, иначе число и список.
 * @param traits - умения класса
 */
export function getClassSkillsLabel(traits: ClassTraits): string {
  if (traits.skillAvailableCount === SKILLS_COUNT) {
    return CLASS_TEXT.anySkills;
  }

  const skills = (traits.availableSkills ?? []).join(CHARACTER_LIST_SEPARATOR);

  return `${CLASS_TEXT.chooseSkills} ${traits.skillAvailableCount} ${CLASS_TEXT.chooseSkillsFrom} ${skills}`;
}

/**
 * Умения класса и архетипа по уровням; сам архетип идёт первым на своём
 * уровне, как в старом SPA.
 * @param traits - умения класса
 */
export function sortClassFeatures(traits: ClassTraits): Array<ClassFeature> {
  const features = traits.archetype
    ? [...(traits.features ?? []), traits.archetype]
    : (traits.features ?? []);

  return sortBy(features, [
    (feature) => feature.level,
    (feature) => (feature.archetypeRoot ? 0 : 1),
  ]);
}

/**
 * Умение по якорю из таблицы уровней, например `#c12`.
 * @param traits - умения класса
 * @param anchor - якорь ссылки
 */
export function findClassFeature(
  traits: ClassTraits,
  anchor: string,
): ClassFeature | undefined {
  const id = anchor.replace(/^#/, '');

  return sortClassFeatures(traits).find((feature) => feature.id === id);
}

/**
 * Умения самого архетипа, без умений класса.
 * @param traits - умения архетипа
 */
export function getArchetypeFeatures(traits: ClassTraits): Array<ClassFeature> {
  return (traits.features ?? []).filter((feature) => feature.archetypeFeature);
}

/**
 * Текст вкладки «Описание»: у архетипа описание лежит в его умении.
 * @param entry - класс или архетип
 */
export function getClassDescription(entry: ClassDetail): string | undefined {
  return entry.description ?? entry.traits?.archetype?.description ?? undefined;
}

/**
 * Заголовок колонки уровня в таблице заклинаний архетипа.
 * @param table - таблица заклинаний
 */
export function getArchetypeSpellLevelHeader(
  table: ArchetypeSpellTable,
): string {
  return table.levelType === ARCHETYPE_SPELL_LEVEL_TYPE
    ? CLASS_TEXT.spellLevel
    : `${CLASS_TEXT.classLevel} ${table.classNameGenitive ?? ''}`.trim();
}

/**
 * Хвост заклинания в таблице архетипа: условие в скобках и запятая перед
 * следующим заклинанием.
 * @param spell - заклинание архетипа
 * @param isLast - последнее ли оно в строке
 */
export function getArchetypeSpellSuffix(
  spell: ArchetypeSpell,
  isLast: boolean,
): string {
  const advanced = spell.advanced ? ` (${spell.advanced})` : '';

  return isLast ? advanced : `${advanced}${REFERENCE_SEPARATOR}`;
}
