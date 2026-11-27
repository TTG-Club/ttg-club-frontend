import type {
  LssCharacter,
  LssDetailRow,
  LssResource,
  LssSpellSlot,
  LssTextBlock,
  LssWeapon,
} from './types';

import { z } from 'zod';

import { LSS_DETAIL_LABELS, LSS_JSON_TYPE } from './constants';

/**
 * Разбор файла Long Story Short. Схема сплошь на `catch`-дефолтах: файл собран
 * чужим приложением, его версии отличаются полями, и пропущенный блок не должен
 * ронять импорт целиком. Обязателен только признак `jsonType` — по нему файл и
 * узнаётся среди посторонних JSON.
 */

/** Строковое значение LSS: часть подписей приходит числом. */
const textSchema = z
  .union([z.string(), z.number()])
  .transform(String)
  .catch('');

/** Числовое значение LSS: пустая строка и `null` значат «не задано». */
const numberSchema = z.coerce.number().catch(0);

/** Поле LSS вида `{ value }` со строкой. */
const textFieldSchema = z
  .object({ value: textSchema })
  .catch({ value: '' })
  .transform((field) => field.value);

/** Поле LSS вида `{ value }` с числом. */
const numberFieldSchema = z
  .object({ value: numberSchema })
  .catch({ value: 0 })
  .transform((field) => field.value);

/** Поле LSS вида `{ value }` с флагом. */
const flagFieldSchema = z
  .object({ value: z.boolean().catch(false) })
  .catch({ value: false })
  .transform((field) => field.value);

const infoSchema = z
  .object({
    charClass: textFieldSchema,
    charSubclass: textFieldSchema,
    level: numberFieldSchema,
    background: textFieldSchema,
    playerName: textFieldSchema,
    race: textFieldSchema,
    alignment: textFieldSchema,
    experience: numberFieldSchema,
    size: textFieldSchema,
  })
  .optional()
  .catch(undefined);

const subInfoSchema = z
  .object({
    age: textFieldSchema,
    height: textFieldSchema,
    weight: textFieldSchema,
    eyes: textFieldSchema,
    skin: textFieldSchema,
    hair: textFieldSchema,
  })
  .optional()
  .catch(undefined);

const spellsInfoSchema = z
  .object({
    base: z.object({ code: z.string().catch('') }).catch({ code: '' }),
  })
  .optional()
  .catch(undefined);

const vitalitySchema = z
  .object({
    'hp-max': numberFieldSchema,
    'hp-current': numberFieldSchema,
    'hp-temp': numberFieldSchema,
    'hp-dice-current': numberFieldSchema,
    'hit-die': textFieldSchema,
    'speed': numberFieldSchema,
    'darkvision': numberFieldSchema,
    'ac': numberFieldSchema,
    // Щит в LSS хранится отдельно от класса доспеха и складывается с ним.
    'shield': z
      .object({ value: z.boolean().catch(false), mod: numberSchema })
      .catch({ value: false, mod: 0 }),
  })
  .optional()
  .catch(undefined);

const weaponSchema = z.object({
  name: textFieldSchema,
  dmg: textFieldSchema,
  dmgType: textFieldSchema,
  isProf: z.boolean().catch(false),
});

const slotsRecordSchema = z
  .record(
    z.string(),
    z
      .object({ value: numberSchema, filled: numberSchema })
      .catch({ value: 0, filled: 0 }),
  )
  .catch({});

const statsSchema = z
  .record(z.string(), z.object({ score: numberSchema }).catch({ score: 0 }))
  .catch({});

const savesSchema = z
  .record(
    z.string(),
    z.object({ isProf: z.boolean().catch(false) }).catch({ isProf: false }),
  )
  .catch({});

const skillsSchema = z
  .record(z.string(), z.object({ isProf: numberSchema }).catch({ isProf: 0 }))
  .catch({});

const resourcesSchema = z
  .record(
    z.string(),
    z
      .object({
        name: textSchema,
        current: numberSchema,
        max: numberSchema,
        isShortRest: z.boolean().catch(false),
        isLongRest: z.boolean().catch(false),
      })
      .catch({
        name: '',
        current: 0,
        max: 0,
        isShortRest: false,
        isLongRest: false,
      }),
  )
  .catch({});

const textsSchema = z
  .record(
    z.string(),
    z
      .object({
        value: z.object({ data: z.unknown() }).catch({ data: undefined }),
      })
      .catch({ value: { data: undefined } }),
  )
  .catch({});

/** Документ персонажа LSS (содержимое поля `data`). */
const lssDataSchema = z.object({
  jsonType: z.string().catch(''),
  name: textFieldSchema,
  info: infoSchema,
  subInfo: subInfoSchema,
  spellsInfo: spellsInfoSchema,
  spells: slotsRecordSchema,
  spellsPact: slotsRecordSchema,
  stats: statsSchema,
  saves: savesSchema,
  skills: skillsSchema,
  vitality: vitalitySchema,
  weaponsList: z.array(weaponSchema).catch([]),
  text: textsSchema,
  coins: z.record(z.string(), numberFieldSchema).catch({}),
  resources: resourcesSchema,
  prof: z.record(z.string(), flagFieldSchema).catch({}),
  inspiration: z.boolean().catch(false),
  // Полей под пользовательские бонусы и настройку предметов на листе нет —
  // нужен только сам факт, чтобы предупредить о них после импорта.
  bonuses: z.array(z.unknown()).catch([]),
  attunementsList: z
    .array(z.object({ value: textSchema }).catch({ value: '' }))
    .catch([]),
});

/** Обёртка файла LSS: сам документ персонажа лежит строкой в поле `data`. */
const lssFileSchema = z
  .object({ data: z.unknown() })
  .catch({ data: undefined });

/** Ключ ячеек заклинаний в LSS (`slots-1`). */
const SLOTS_KEY_PATTERN = /^slots-(\d+)$/;

/** Номинал кости хитов в LSS записан строкой (`d8`). */
const HIT_DIE_PATTERN = /(\d+)/;

/**
 * Документ персонажа из содержимого файла: LSS кладёт его строкой в поле `data`,
 * но встречаются выгрузки и с объектом, и вовсе без обёртки.
 *
 * @param input разобранное содержимое файла.
 * @returns документ персонажа для разбора схемой.
 */
function getCharacterPayload(input: unknown): unknown {
  const file = lssFileSchema.safeParse(input);
  const data: unknown = file.success ? file.data.data : undefined;

  if (typeof data === 'string') {
    try {
      const parsed: unknown = JSON.parse(data);

      return parsed;
    } catch {
      return input;
    }
  }

  return data && typeof data === 'object' ? data : input;
}

/**
 * Ячейки заклинаний из блока LSS: круг берётся из ключа (`slots-1`), а трата —
 * из числа заполненных.
 *
 * @param slots блок ячеек документа LSS.
 * @returns ячейки по кругам.
 */
function toSpellSlots(
  slots: Record<string, { value: number; filled: number }>,
): LssSpellSlot[] {
  const result: LssSpellSlot[] = [];

  for (const [key, slot] of Object.entries(slots)) {
    const level = Number(SLOTS_KEY_PATTERN.exec(key)?.[1]);

    if (!Number.isInteger(level) || level < 1) {
      continue;
    }

    result.push({ level, used: slot.filled, max: slot.value });
  }

  return result.sort((left, right) => left.level - right.level);
}

/**
 * Подписи шапки LSS: мировоззрение, имя игрока и внешность. Ключи остаются
 * «родными» — раскладывает их по полям листа `convert.ts`. Пустые значения
 * пропускаются.
 *
 * @param values значения полей по ключам LSS.
 * @returns подписи шапки в порядке `LSS_DETAIL_LABELS`.
 */
function toDetailRows(values: Record<string, string>): LssDetailRow[] {
  const rows: LssDetailRow[] = [];

  for (const [key, label] of Object.entries(LSS_DETAIL_LABELS)) {
    const value = values[key]?.trim();

    if (value) {
      rows.push({ key, label, value });
    }
  }

  return rows;
}

/**
 * Счётчики листа из блока ресурсов LSS. Записи без названия пропускаются —
 * такие остаются в файле от удалённых счётчиков.
 *
 * @param resources блок ресурсов документа LSS.
 * @returns счётчики персонажа.
 */
function toResources(
  resources: Record<
    string,
    {
      name: string;
      current: number;
      max: number;
      isShortRest: boolean;
      isLongRest: boolean;
    }
  >,
): LssResource[] {
  return Object.values(resources)
    .filter((resource) => resource.name.trim())
    .map((resource) => ({
      name: resource.name.trim(),
      current: resource.current,
      max: resource.max,
      shortRest: resource.isShortRest,
      longRest: resource.isLongRest,
    }));
}

/**
 * Текстовые блоки листа: пустые (в файле остаются пустые документы редактора)
 * отсеиваются уже при разборе документа.
 *
 * @param texts блок текстов документа LSS.
 * @returns блоки с документами редактора.
 */
function toTextBlocks(
  texts: Record<string, { value: { data: unknown } }>,
): LssTextBlock[] {
  return Object.entries(texts)
    .filter(([, block]) => Boolean(block.value.data))
    .map(([key, block]) => ({ key, doc: block.value.data }));
}

/**
 * Оружие листа: записи без названия пропускаются (в файле остаются пустые
 * строки таблицы атак).
 *
 * @param weapons список атак документа LSS.
 * @returns оружие персонажа.
 */
function toWeapons(
  weapons: Array<{
    name: string;
    dmg: string;
    dmgType: string;
    isProf: boolean;
  }>,
): LssWeapon[] {
  return weapons
    .filter((weapon) => weapon.name.trim())
    .map((weapon) => ({
      name: weapon.name.trim(),
      damage: weapon.dmg.trim(),
      damageType: weapon.dmgType.trim(),
      isProficient: weapon.isProf,
    }));
}

/**
 * Приведение разобранного документа LSS к плоскому виду.
 *
 * @param data разобранный документ персонажа.
 * @returns персонаж LSS.
 */
function toLssCharacter(data: z.infer<typeof lssDataSchema>): LssCharacter {
  const info = data.info;
  const vitality = data.vitality;

  const abilities: Record<string, number> = Object.fromEntries(
    Object.entries(data.stats).map(([code, stat]) => [code, stat.score]),
  );

  const skills: Record<string, number> = Object.fromEntries(
    Object.entries(data.skills)
      .filter(([, skill]) => skill.isProf > 0)
      .map(([key, skill]) => [key.toLowerCase(), skill.isProf]),
  );

  const shieldBonus = vitality?.shield.value ? vitality.shield.mod : 0;

  return {
    name: data.name.trim(),
    className: info?.charClass.trim() ?? '',
    subclassName: info?.charSubclass.trim() ?? '',
    speciesName: info?.race.trim() ?? '',
    backgroundName: info?.background.trim() ?? '',
    size: info?.size.trim().toLowerCase() ?? '',
    level: info?.level ?? 0,
    experience: info?.experience ?? 0,
    details: toDetailRows({
      alignment: info?.alignment ?? '',
      playerName: info?.playerName ?? '',
      age: data.subInfo?.age ?? '',
      height: data.subInfo?.height ?? '',
      weight: data.subInfo?.weight ?? '',
      eyes: data.subInfo?.eyes ?? '',
      skin: data.subInfo?.skin ?? '',
      hair: data.subInfo?.hair ?? '',
    }),
    abilities,
    saves: Object.entries(data.saves)
      .filter(([, save]) => save.isProf)
      .map(([code]) => code),
    skills,
    health: {
      current: vitality?.['hp-current'] ?? 0,
      max: vitality?.['hp-max'] ?? 0,
      temporary: vitality?.['hp-temp'] ?? 0,
    },
    hitDice: {
      die: Number(HIT_DIE_PATTERN.exec(vitality?.['hit-die'] ?? '')?.[1] ?? 0),
      current: vitality?.['hp-dice-current'] ?? 0,
    },
    armorClass: (vitality?.ac ?? 0) + shieldBonus,
    speed: vitality?.speed ?? 0,
    darkvision: vitality?.darkvision ?? 0,
    inspiration: data.inspiration,
    spellcastingAbility: data.spellsInfo?.base.code.trim().toLowerCase() ?? '',
    spellSlots: toSpellSlots(data.spells),
    pactSpellSlots: toSpellSlots(data.spellsPact),
    weapons: toWeapons(data.weaponsList),
    resources: toResources(data.resources),
    proficiencyFlags: Object.entries(data.prof)
      .filter(([, isProficient]) => isProficient)
      .map(([flag]) => flag),
    coins: data.coins,
    texts: toTextBlocks(data.text),
    hasBonuses: data.bonuses.length > 0,
    hasAttunements: data.attunementsList.some((attunement) =>
      attunement.value.trim(),
    ),
  };
}

/**
 * Разбор файла Long Story Short.
 *
 * @param input разобранное содержимое JSON-файла.
 * @returns персонаж LSS; null — в файле не лист LSS.
 */
export function parseLssDocument(input: unknown): LssCharacter | null {
  const result = lssDataSchema.safeParse(getCharacterPayload(input));

  if (!result.success || result.data.jsonType !== LSS_JSON_TYPE) {
    return null;
  }

  return toLssCharacter(result.data);
}
