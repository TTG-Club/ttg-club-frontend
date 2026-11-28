import type {
  SheetDocument,
  SheetItem,
  SheetNote,
  SkillProficiency,
} from '../schema';
import type { AbilityKey, SkillKey } from '../types';
import type {
  LssCharacter,
  LssResource,
  LssSpellSlot,
  LssTextBlock,
  LssWeapon,
} from './types';

import { clamp } from 'es-toolkit';

import { createSheetItem } from '../catalog';
import { CHARACTER_LEVEL, SPELL_SLOT_LEVELS } from '../constants';
import { sheetDocumentSchema } from '../schema';
import { createSheetElementId } from '../utils';
import {
  LSS_ABILITY_KEYS,
  LSS_ALIGNMENT_DETAIL_KEY,
  LSS_ARMOR_PROFICIENCY_LABELS,
  LSS_COIN_KEYS,
  LSS_DEFAULT_HIT_DIE,
  LSS_DETAILS_NOTE_TITLE,
  LSS_EQUIPMENT_TEXT_KEYS,
  LSS_FEATURE_TEXT_KEYS,
  LSS_ITEM_NAME_MAX_LENGTH,
  LSS_ITEMS_LINK_PATH,
  LSS_MARTIAL_WEAPON_FLAG,
  LSS_NOTES_KEY_PATTERN,
  LSS_NOTES_TITLE,
  LSS_PATTERNS,
  LSS_PERSONALITY_DETAIL_KEYS,
  LSS_PERSONALITY_TEXT_KEYS,
  LSS_SIZE_KEYS,
  LSS_SKILL_EXPERTISE_VALUE,
  LSS_SKILL_KEYS,
  LSS_SOURCE_LABEL,
  LSS_TEXT_TITLES,
  LSS_TOOLS_TEXT_KEY,
  LSS_UNKNOWN_TEXT_TITLE,
  LSS_WEAPON_PROFICIENCY_LABELS,
} from './constants';
import {
  collectListItemTexts,
  collectSectionLinks,
  toMarkupList,
  toMarkupText,
} from './tiptap';

/**
 * Документ листа из персонажа LSS — без обращений к справочнику. Класс, раса
 * и предыстория заводятся своими (без адреса); адреса справочника им
 * подставляет `catalog.ts`, если записи нашлись. Значения характеристик в LSS
 * уже итоговые, поэтому бонусы расы заново не прибавляются.
 */

/**
 * Уровень из файла: пустое или битое значение — первый.
 * @param level - уровень из файла
 */
function toLevel(level: number): number {
  return clamp(
    Math.trunc(level) || CHARACTER_LEVEL.min,
    CHARACTER_LEVEL.min,
    CHARACTER_LEVEL.max,
  );
}

/**
 * Неотрицательное целое.
 * @param value - число из файла
 */
function toCount(value: number): number {
  return Math.max(0, Math.trunc(value) || 0);
}

/**
 * Значения характеристик: ноль — не заполнено, остаётся по умолчанию.
 * @param abilities - значения по кодам LSS
 */
function toAbilities(
  abilities: Record<string, number>,
): Partial<Record<AbilityKey, number>> {
  const result: Partial<Record<AbilityKey, number>> = {};

  for (const [code, score] of Object.entries(abilities)) {
    const key = LSS_ABILITY_KEYS[code];

    if (key && score > 0) {
      result[key] = Math.trunc(score);
    }
  }

  return result;
}

/**
 * Уровень владения навыком: 2 — компетентность, дробное — половина бонуса.
 * @param value - значение `isProf` из файла
 */
function toSkillProficiency(value: number): SkillProficiency {
  if (value >= LSS_SKILL_EXPERTISE_VALUE) {
    return 'expertise';
  }

  return value < 1 ? 'half' : 'proficient';
}

/**
 * Владение навыками по ключам листа.
 * @param skills - уровни по ключам LSS
 */
function toSkills(
  skills: Record<string, number>,
): Partial<Record<SkillKey, SkillProficiency>> {
  const result: Partial<Record<SkillKey, SkillProficiency>> = {};

  for (const [name, value] of Object.entries(skills)) {
    const key = LSS_SKILL_KEYS[name];

    if (key) {
      result[key] = toSkillProficiency(value);
    }
  }

  return result;
}

/**
 * Названия групп владений по флагам LSS.
 * @param flags - включённые флаги
 * @param labels - название группы по флагу
 */
function toGroupProficiencies(
  flags: ReadonlyArray<string>,
  labels: Readonly<Record<string, string>>,
): Array<string> {
  return [
    ...new Set(flags.flatMap((flag) => (labels[flag] ? [labels[flag]] : []))),
  ];
}

/**
 * Владения инструментами: в тексте LSS они стоят ссылками на «Предметы».
 * @param texts - текстовые блоки
 */
function toTools(
  texts: ReadonlyArray<LssTextBlock>,
): Array<{ name: string; url: string }> {
  const block = texts.find((text) => text.key === LSS_TOOLS_TEXT_KEY);

  if (!block) {
    return [];
  }

  const tools = new Map<string, { name: string; url: string }>();

  for (const link of collectSectionLinks(block.doc, LSS_ITEMS_LINK_PATH)) {
    tools.set(link.url, link);
  }

  return [...tools.values()];
}

/**
 * Ресурсы листа: LSS хранит остаток, лист — потраченное.
 * @param resources - счётчики LSS
 */
function toResources(resources: ReadonlyArray<LssResource>) {
  return resources.flatMap((resource) => {
    const max = toCount(resource.max);

    if (max <= 0) {
      return [];
    }

    return [
      {
        id: createSheetElementId(),
        name: resource.name,
        max,
        used: max - clamp(toCount(resource.current), 0, max),
        reset: resource.shortRest && !resource.longRest ? 'SHORT' : 'LONG',
      },
    ];
  });
}

/**
 * Потраченные ячейки 1–9 кругов.
 * @param slots - ячейки LSS
 */
function toSpellSlotsUsed(slots: ReadonlyArray<LssSpellSlot>): Array<number> {
  return Array.from({ length: SPELL_SLOT_LEVELS }, (_, index) => {
    const slot = slots.find((entry) => entry.level === index + 1);

    return slot ? clamp(toCount(slot.used), 0, toCount(slot.max)) : 0;
  });
}

/**
 * Заголовок текстового блока на листе.
 * @param key - ключ блока в шаблоне LSS
 */
function getTextTitle(key: string): string {
  const known = LSS_TEXT_TITLES[key];

  if (known) {
    return known;
  }

  const number = LSS_NOTES_KEY_PATTERN.exec(key)?.[1];

  return number ? `${LSS_NOTES_TITLE} ${number}` : LSS_UNKNOWN_TEXT_TITLE;
}

/** Блоки, которые ложатся в поля личности. */
const PERSONALITY_TEXT_KEYS = new Set<string>(
  Object.keys(LSS_PERSONALITY_TEXT_KEYS),
);

/**
 * Личность: тексты черт, идеалов, привязанностей, слабостей и предыстории,
 * а приметы — из шапки.
 * @param source - персонаж LSS
 */
function toPersonality(source: LssCharacter): Record<string, unknown> {
  const personality: Record<string, unknown> = {};

  for (const [key, field] of Object.entries(LSS_PERSONALITY_TEXT_KEYS)) {
    const block = source.texts.find((text) => text.key === key);

    if (block) {
      personality[field] = toMarkupText(block.doc);
    }
  }

  for (const key of LSS_PERSONALITY_DETAIL_KEYS) {
    const detail = source.details.find((row) => row.key === key);

    if (detail) {
      personality[key] = detail.value;
    }
  }

  return personality;
}

/**
 * Особенности: блоки умений и черт — по одной записи на блок.
 * @param texts - текстовые блоки
 */
function toFeatures(texts: ReadonlyArray<LssTextBlock>) {
  return LSS_FEATURE_TEXT_KEYS.flatMap((key) => {
    const block = texts.find((text) => text.key === key);
    const description = block ? toMarkupText(block.doc) : [];

    return description.length
      ? [
          {
            id: createSheetElementId(),
            name: getTextTitle(key),
            source: LSS_SOURCE_LABEL,
            origin: 'custom',
            choice: '',
            description,
          },
        ]
      : [];
  });
}

/**
 * Название без уточнения в скобках.
 * @param name - название
 */
function stripParenthetical(name: string): string {
  return name.replace(LSS_PATTERNS.parenthetical, '').trim();
}

/**
 * Ключ сравнения названий: без регистра, «ё» и уточнения в скобках.
 * @param name - название
 */
export function normalizeLssName(name: string): string {
  return stripParenthetical(name).toLocaleLowerCase().replaceAll('ё', 'е');
}

/**
 * Уточнение в скобках: «Дварф (горный)» → «горный».
 * @param name - название
 */
export function getLssParenthetical(name: string): string {
  return LSS_PATTERNS.parenthetical.exec(name)?.[1]?.trim() ?? '';
}

/**
 * Количество в конце строки снаряжения: «Стрелы ×20».
 * @param text - строка списка
 */
function parseQuantity(text: string): { name: string; quantity: number } {
  const match = LSS_PATTERNS.itemQuantity.exec(text);
  const quantity = Number(match?.[1] ?? 1);

  return {
    name: match ? text.slice(0, match.index).trim() : text,
    quantity: quantity > 0 ? quantity : 1,
  };
}

/**
 * Строка похожа на название предмета, а не на заголовок или описание.
 * @param name - строка
 */
function isItemName(name: string): boolean {
  return Boolean(
    name && name.length <= LSS_ITEM_NAME_MAX_LENGTH && !name.endsWith(':'),
  );
}

/**
 * Своё оружие из атаки LSS: кость урона, тип, фехтовальное по Ловкости.
 * @param weapon - атака LSS
 * @param isMartial - персонаж владеет воинским оружием
 */
function toWeaponItem(weapon: LssWeapon, isMartial: boolean): SheetItem {
  const formula = weapon.damage.replace(LSS_PATTERNS.damageAbilityToken, ' ');
  const dice = LSS_PATTERNS.damageDice.exec(formula);

  return {
    ...createSheetItem(weapon.name, null),
    weapon: {
      damage: dice ? `${dice[1] || 1}к${dice[2]}` : '',
      damageType: weapon.damageType,
      isRanged: false,
      isFinesse: LSS_PATTERNS.dexterityDamage.test(weapon.damage),
      proficiency: weapon.isProficient ? 'yes' : 'no',
      bonus: 0,
      isMartial,
      isHeavy: false,
      versatileDamage: '',
      extraDamage: '',
      extraDamageType: '',
    },
  };
}

/** Снаряжение из файла: предметы и строки, которые предметами не стали. */
interface LssEquipment {
  items: Array<SheetItem>;
  /** Нераспознанные строки по ключу блока снаряжения. */
  leftovers: Map<string, Array<string>>;
}

/**
 * Снаряжение: атаки — своим оружием, пункты списков блоков снаряжения —
 * своими предметами. Повторы по названию пропускаются.
 * @param source - персонаж LSS
 */
function toEquipment(source: LssCharacter): LssEquipment {
  const items: Array<SheetItem> = [];
  const leftovers = new Map<string, Array<string>>();
  const taken = new Set<string>();
  const isMartial = source.proficiencyFlags.includes(LSS_MARTIAL_WEAPON_FLAG);

  for (const weapon of source.weapons) {
    const key = normalizeLssName(weapon.name);

    if (!taken.has(key)) {
      taken.add(key);
      items.push(toWeaponItem(weapon, isMartial));
    }
  }

  for (const block of source.texts) {
    if (!LSS_EQUIPMENT_TEXT_KEYS.includes(block.key)) {
      continue;
    }

    const blockLeftovers: Array<string> = [];

    for (const line of collectListItemTexts(block.doc)) {
      const { name, quantity } = parseQuantity(line);

      if (!isItemName(name)) {
        blockLeftovers.push(line);

        continue;
      }

      const key = normalizeLssName(name);

      if (!taken.has(key)) {
        taken.add(key);
        items.push({ ...createSheetItem(name, null), quantity });
      }
    }

    leftovers.set(block.key, blockLeftovers);
  }

  return { items, leftovers };
}

/**
 * Заметки: по одной на прочие текстовые блоки, у блоков снаряжения — только
 * то, что не стало предметами; плюс подписи шапки без своих полей.
 * @param source - персонаж LSS
 * @param leftovers - нераспознанные строки снаряжения
 */
function toNotes(
  source: LssCharacter,
  leftovers: Map<string, Array<string>>,
): Array<SheetNote> {
  const notes: Array<SheetNote> = [];

  for (const block of source.texts) {
    if (
      LSS_FEATURE_TEXT_KEYS.includes(block.key)
      || PERSONALITY_TEXT_KEYS.has(block.key)
    ) {
      continue;
    }

    const isEquipment = LSS_EQUIPMENT_TEXT_KEYS.includes(block.key);
    const rest = leftovers.get(block.key) ?? [];

    const text = [
      ...toMarkupText(block.doc, isEquipment),
      ...(isEquipment && rest.length ? [toMarkupList(rest)] : []),
    ];

    if (text.length) {
      notes.push({
        id: createSheetElementId(),
        title: getTextTitle(block.key),
        text,
      });
    }
  }

  const fieldBacked = new Set<string>([
    ...LSS_PERSONALITY_DETAIL_KEYS,
    LSS_ALIGNMENT_DETAIL_KEY,
  ]);

  const details = source.details.filter((row) => !fieldBacked.has(row.key));

  if (details.length) {
    notes.push({
      id: createSheetElementId(),
      title: LSS_DETAILS_NOTE_TITLE,
      text: [toMarkupList(details.map((row) => `${row.label}: ${row.value}`))],
    });
  }

  return notes;
}

/**
 * Документ листа из персонажа LSS.
 * @param source - персонаж LSS
 */
export function convertLssCharacter(source: LssCharacter): SheetDocument {
  const level = toLevel(source.level);
  const hitDie = source.hitDice.die || LSS_DEFAULT_HIT_DIE;
  const maxHitPoints = toCount(source.health.max);
  const pactSlot = source.pactSpellSlots.find((slot) => slot.max > 0);
  const equipment = toEquipment(source);

  const alignment =
    source.details.find((row) => row.key === LSS_ALIGNMENT_DETAIL_KEY)?.value
    ?? '';

  return sheetDocumentSchema.parse({
    race: source.speciesName ? { name: source.speciesName, url: null } : null,
    background: source.backgroundName
      ? { name: source.backgroundName, url: null }
      : null,
    alignment,
    classes: source.className
      ? [
          {
            id: createSheetElementId(),
            name: source.className,
            url: null,
            archetypeName: source.subclassName || null,
            archetypeUrl: null,
            // Мультикласс LSS не размечает — весь уровень идёт классу
            level,
            hitDie,
            hitPointGains: [],
            spellcastingAbility:
              LSS_ABILITY_KEYS[source.spellcastingAbility] ?? null,
          },
        ]
      : [],
    experience: toCount(source.experience),
    inspiration: source.inspiration,
    abilities: {
      ...sheetDocumentSchema.parse({}).abilities,
      ...toAbilities(source.abilities),
    },
    savingThrows: source.saves.flatMap((code) =>
      LSS_ABILITY_KEYS[code] ? [LSS_ABILITY_KEYS[code]] : [],
    ),
    skills: toSkills(source.skills),
    // Значение из LSS уже учитывает доспех, щит и Ловкость
    armorClassOverride: source.armorClass > 0 ? source.armorClass : null,
    armorClassAbilities: source.armorClass > 0 ? [] : undefined,
    speed: toCount(source.speed),
    darkvision: toCount(source.darkvision),
    size: LSS_SIZE_KEYS[source.size as keyof typeof LSS_SIZE_KEYS] ?? null,
    health: {
      max: maxHitPoints,
      current: clamp(toCount(source.health.current), 0, maxHitPoints),
      temporary: toCount(source.health.temporary),
    },
    hitDiceUsed: {
      [hitDie]: level - clamp(toCount(source.hitDice.current), 0, level),
    },
    proficiencies: {
      armor: toGroupProficiencies(
        source.proficiencyFlags,
        LSS_ARMOR_PROFICIENCY_LABELS,
      ),
      weapons: toGroupProficiencies(
        source.proficiencyFlags,
        LSS_WEAPON_PROFICIENCY_LABELS,
      ),
      tools: toTools(source.texts),
      languages: [],
    },
    currency: Object.fromEntries(
      Object.entries(source.coins).flatMap(([code, amount]) =>
        LSS_COIN_KEYS[code] ? [[LSS_COIN_KEYS[code], toCount(amount)]] : [],
      ),
    ),
    inventory: equipment.items,
    spellcastingAbility: LSS_ABILITY_KEYS[source.spellcastingAbility] ?? null,
    spellSlotsUsed: toSpellSlotsUsed(source.spellSlots),
    pactSlotsUsed: pactSlot
      ? clamp(toCount(pactSlot.used), 0, pactSlot.max)
      : 0,
    features: toFeatures(source.texts),
    resources: toResources(source.resources),
    personality: toPersonality(source),
    notes: toNotes(source, equipment.leftovers),
  });
}
