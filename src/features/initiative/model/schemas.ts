import { z } from '@/shared/utils/zod';

import { DEFAULT_TRACKER_NAME } from './constants';

import type {
  AnonTrackerSlot,
  CreatureOption,
  CreatureSummary,
  TrackerDetailed,
  TrackerListItem,
} from './types';

/**
 * Схема одного участника. Числовые поля приведены (`coerce`) и снабжены
 * `catch`-дефолтами: бэк ещё не развёрнут, поэтому валидация должна быть
 * устойчивой к мелким расхождениям типов, а не падать на них.
 */
const participantSchema = z.object({
  id: z.string(),
  type: z.enum(['PLAYER', 'CREATURE']).catch('CREATURE'),
  typeName: z.string().catch(''),
  name: z.string().catch(''),
  dead: z.boolean().catch(false),
  initiativeBonus: z.coerce.number().catch(0),
  initiativeRoll: z.coerce.number().optional(),
  initiativeTotal: z.coerce.number().optional(),
  creatureUrl: z.string().optional(),
});

/** Схема полного состояния трекера (ответ мутаций и `GET /{id}`). */
const trackerDetailedSchema = z.object({
  id: z.string(),
  name: z.string().catch(DEFAULT_TRACKER_NAME),
  status: z.enum(['PREPARING', 'ACTIVE']).catch('PREPARING'),
  statusName: z.string().catch(''),
  round: z.coerce.number().catch(0),
  currentParticipantId: z.string().optional(),
  accessKey: z.string().optional(),
  createdAt: z.string().catch(''),
  updatedAt: z.string().catch(''),
  participants: z.array(participantSchema).catch([]),
});

/** Схема короткого объекта трекера из списка `GET /`. */
const trackerListItemSchema = z.object({
  id: z.string(),
  name: z.string().catch(DEFAULT_TRACKER_NAME),
  status: z.enum(['PREPARING', 'ACTIVE']).catch('PREPARING'),
  statusName: z.string().catch(''),
  round: z.coerce.number().catch(0),
  deleted: z.boolean().catch(false),
  createdAt: z.string().catch(''),
  updatedAt: z.string().catch(''),
});

const trackerListSchema = z.array(trackerListItemSchema);

/**
 * Валидирует и нормализует полное состояние трекера из ответа API.
 * @param input Сырой ответ сервера.
 */
export function parseTrackerDetailed(input: unknown): TrackerDetailed {
  // `.catch(...)` в выходном типе zod помечает поля опциональными, но в рантайме
  // они всегда заполнены дефолтом — приводим к строгой модели на границе.
  return trackerDetailedSchema.parse(input) as TrackerDetailed;
}

/**
 * Валидирует список трекеров из ответа `GET /`.
 * @param input Сырой ответ сервера.
 */
export function parseTrackerList(input: unknown): Array<TrackerListItem> {
  return trackerListSchema.parse(input) as Array<TrackerListItem>;
}

/**
 * Схема слота анонимного трекера в localStorage. Чужое или битое значение
 * (иная форма, обрезанный JSON) не должно приниматься на веру.
 */
const anonTrackerSlotSchema = z.object({
  trackerId: z.string().min(1),
  accessKey: z.string().min(1),
});

/**
 * Валидирует слот анонимного трекера, прочитанный из localStorage.
 * @param input Сырое значение из хранилища.
 * @returns Слот либо `null`, если значение отсутствует или повреждено.
 */
export function parseAnonTrackerSlot(input: unknown): AnonTrackerSlot | null {
  const result = anonTrackerSlotSchema.safeParse(input);

  return result.success ? result.data : null;
}

/**
 * Схема ссылки на существо из поиска бестиария. Валидируем только поля, что
 * реально используем в автокомплите; пропущенные подписи не роняют разбор.
 */
const creatureLinkSchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string().catch('') }),
  challengeRating: z.string().catch(''),
});

/** Ответ поиска бестиария: плоский массив или страница `{ value, Count }`. */
const creatureSearchResponseSchema = z
  .union([
    z.array(creatureLinkSchema),
    z.object({ value: z.array(creatureLinkSchema) }),
  ])
  .catch([]);

/**
 * Валидирует ответ `POST /api/v1/bestiary` и приводит его к плоскому списку
 * опций автокомплита. Битый или неожиданный ответ даёт пустой список, а не
 * бросок исключения.
 * @param input Сырой ответ бестиария.
 */
export function parseCreatureOptions(input: unknown): Array<CreatureOption> {
  const parsed = creatureSearchResponseSchema.parse(input);
  const list = Array.isArray(parsed) ? parsed : parsed.value;

  return list.map((creature) => ({
    url: creature.url,
    label: creature.name.rus,
    challengeRating: creature.challengeRating,
  }));
}

/** Формирует полную формулу хитов из костей и числового модификатора. */
function formatHitFormula(formula: string, bonus: number): string {
  if (!formula || bonus === 0) {
    return formula;
  }

  const operator = bonus > 0 ? '+' : '-';

  return `${formula} ${operator} ${Math.abs(bonus)}`;
}

/**
 * Схема детального ответа существа `ttg-club-backend`: строке трекера нужны
 * первая картинка, КД, показатель опасности, средние хиты и формула броска.
 */
const creatureSummarySchema = z
  .object({
    images: z.array(z.string()).catch([]),
    armorClass: z.coerce.string().catch(''),
    challengeRating: z.string().catch(''),
    hits: z
      .object({
        average: z.coerce.number().catch(0),
        formula: z.string().catch(''),
        bonus: z.coerce.number().catch(0),
      })
      .catch({ average: 0, formula: '', bonus: 0 }),
  })
  .catch({
    images: [],
    armorClass: '',
    challengeRating: '',
    hits: { average: 0, formula: '', bonus: 0 },
  });

/**
 * Валидирует детальный ответ `GET /api/v2/bestiary/{url}` и возвращает сводку
 * существа для строки трекера (пустые строки и `0` хитов — поля нет либо ответ
 * неожиданный).
 * @param input Сырой детальный ответ бестиария.
 */
export function parseCreatureSummary(input: unknown): CreatureSummary {
  const parsed = creatureSummarySchema.parse(input);

  return {
    image: parsed.images[0] ?? '',
    armorClass: parsed.armorClass,
    challengeRating: parsed.challengeRating,
    maxHitPoints: parsed.hits.average,
    hitFormula: formatHitFormula(parsed.hits.formula, parsed.hits.bonus),
  };
}
