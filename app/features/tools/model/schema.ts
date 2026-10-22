import { z } from 'zod';

import { magicItemLinkSchema, treasureSchema } from '~inventory/model';
import { entryNameSchema, entrySourceSchema } from '~section/model';

/** Вариант выбора из ручки инструмента: подпись и значение. */
const nameValueSchema = z.object({
  name: z.string(),
  value: z.string(),
});

/** Виды безумия: кратковременное, долговременное, бессрочное. */
export const madnessTypesSchema = z.array(nameValueSchema);

/** Безумие: описание и вид с выброшенной длительностью. */
export const madnessResultSchema = z.object({
  description: z.string(),
  type: z.object({
    name: z.string(),
    value: z.string(),
    additional: z.string().nullish(),
  }),
});

/** Книги, в которых есть таблицы дикой магии. */
export const wildMagicSourcesSchema = z.array(entrySourceSchema);

/** Эффект дикой магии и книга, из которой он взят. */
export const wildMagicResultSchema = z.object({
  description: z.string(),
  source: entrySourceSchema,
});

/** Варианты формы столкновений: окружения и уровни группы. */
export const encounterOptionsSchema = z.object({
  environments: z.array(nameValueSchema),
  levels: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
    }),
  ),
});

/**
 * Столкновение. Если в таблице ничего не выпало, бэкенд отдаёт только
 * описание.
 */
export const encounterResultSchema = z.object({
  tableName: z.string().nullish(),
  description: z.string(),
  source: entrySourceSchema.nullish(),
});

/**
 * Расы для генератора имён. Раса без своих имён приходит, только если у неё
 * есть подрасы с именами: она становится заголовком группы.
 */
export const nameRacesSchema = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
    parentId: z.number().nullish(),
    available: z.boolean(),
  }),
);

/** Готовое имя с расой и полом. */
export const nameResultSchema = z.object({
  value: z.string(),
  race: z.string(),
  sex: z.enum(['MALE', 'FEMALE', 'UNISEX']).nullish(),
});

/** Бонус расы: характеристика или бонус на выбор (`ONE`, `CHOICE`...). */
const raceBonusSchema = z.object({
  key: z.string().nullish(),
  name: z.string(),
  value: z.number().nullish(),
});

const abilityRaceBaseSchema = z.object({
  name: entryNameSchema,
  url: z.string().min(1),
  source: entrySourceSchema.nullish(),
  abilities: z.array(raceBonusSchema).nullish(),
});

/** Расы с бонусами для калькулятора, подрасы со своими бонусами. */
export const abilityRacesSchema = z.array(
  abilityRaceBaseSchema.extend({
    subraces: z.array(abilityRaceBaseSchema).nullish(),
  }),
);
/** Варианты формы торговца: количество магии и книги с ценами. */
export const traderOptionsSchema = z.object({
  magicLevels: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
    }),
  ),
  sources: z.array(entrySourceSchema),
});

/**
 * Магический предмет из инструмента: цена по каждой книге строкой с
 * числом, у свитка — его заклинание.
 */
export const lootMagicItemSchema = magicItemLinkSchema.extend({
  price: z.record(z.string(), z.string().nullish()).nullish(),
  spell: z
    .object({
      name: entryNameSchema,
      url: z.string().min(1),
    })
    .nullish(),
});

/** Товары торговца, по редкости. */
export const traderResultSchema = z.array(lootMagicItemSchema);

const coinSchema = z.number().nullish();

/** Сокровищница: без запрошенного вида добычи поля нет. */
export const treasuryResultSchema = z.object({
  coins: z
    .object({
      copper: coinSchema,
      silver: coinSchema,
      electrum: coinSchema,
      gold: coinSchema,
      platinum: coinSchema,
    })
    .nullish(),
  magicItems: z.array(lootMagicItemSchema).nullish(),
  gems: z.array(treasureSchema).nullish(),
  arts: z.array(treasureSchema).nullish(),
  trinkets: z.array(treasureSchema).nullish(),
});

export type ToolOption = z.infer<typeof nameValueSchema>;
export type MadnessResult = z.infer<typeof madnessResultSchema>;
export type WildMagicResult = z.infer<typeof wildMagicResultSchema>;
export type EncounterOptions = z.infer<typeof encounterOptionsSchema>;
export type EncounterResult = z.infer<typeof encounterResultSchema>;
export type NameRace = z.infer<typeof nameRacesSchema>[number];
export type NameResult = z.infer<typeof nameResultSchema>;
export type RaceBonus = z.infer<typeof raceBonusSchema>;
export type AbilityRace = z.infer<typeof abilityRacesSchema>[number];
export type TraderOptions = z.infer<typeof traderOptionsSchema>;
export type LootMagicItem = z.infer<typeof lootMagicItemSchema>;
export type TreasuryResult = z.infer<typeof treasuryResultSchema>;
export type TreasuryCoins = NonNullable<TreasuryResult['coins']>;
