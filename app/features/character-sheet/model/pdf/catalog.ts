import type { SpellDetail } from '~character/model';
import type { ContentDescription } from '~content/model';

import type { SheetClassDetail, SheetDocument } from '../schema';
import type { PdfCatalog } from './types';

import { chunk, uniq } from 'es-toolkit';
import { z } from 'zod';

import { spellDetailSchema } from '~character/model';
import { contentDescriptionSchema } from '~content/model';

import { fetchCatalogEntry } from '../api';
import { sheetClassDetailSchema } from '../schema';
import { PDF_CATALOG_REQUEST_BATCH_SIZE } from './constants';

/** Описание предмета любого раздела снаряжения: остальное листу не нужно. */
const itemDescriptionSchema = z.object({
  description: contentDescriptionSchema.nullish(),
});

/**
 * Кэш дозагруженных записей на время жизни страницы: повторный экспорт того же
 * листа (или другого листа с теми же заклинаниями) сети уже не трогает.
 * Неудачи в кэш не пишутся: следующий экспорт попробует запрос снова.
 */
const classCache = new Map<string, SheetClassDetail>();
const spellCache = new Map<string, SpellDetail>();
const itemCache = new Map<string, ContentDescription>();

/**
 * Загрузка одной записи справочника. Отказ не роняет экспорт: без записи лист
 * лишится ячеек класса или карточки в справочнике, но скачается.
 *
 * @param url адрес записи на сайте.
 * @param schema схема ответа.
 * @returns запись или null при любой ошибке запроса или разбора.
 */
async function fetchCatalogSafe<Schema extends z.ZodType>(
  url: string,
  schema: Schema,
): Promise<z.infer<Schema> | null> {
  try {
    return await fetchCatalogEntry(url, schema);
  } catch {
    return null;
  }
}

/**
 * Обход списка запросами пачками. Ограничение нужно, чтобы книга заклинаний на
 * пять десятков записей не открывала пять десятков соединений разом.
 *
 * @param values значения для обработки.
 * @param handle обработчик одного значения.
 */
async function processInBatches<Value>(
  values: ReadonlyArray<Value>,
  handle: (value: Value) => Promise<void>,
): Promise<void> {
  for (const batch of chunk([...values], PDF_CATALOG_REQUEST_BATCH_SIZE)) {
    await Promise.all(batch.map((value) => handle(value)));
  }
}

/**
 * Адреса записей, которых ещё нет в кэше.
 *
 * @param urls адреса из документа; null — своя запись без адреса.
 * @param cache кэш раздела.
 * @returns адреса для дозагрузки без повторов.
 */
function getPendingUrls(
  urls: ReadonlyArray<string | null>,
  cache: ReadonlyMap<string, unknown>,
): string[] {
  return uniq(
    urls.filter((url): url is string => url !== null && !cache.has(url)),
  );
}

/**
 * Записи кэша по адресам документа.
 *
 * @param urls адреса из документа.
 * @param cache кэш раздела.
 * @returns словарь загруженных записей.
 */
function pickCached<Entry>(
  urls: ReadonlyArray<string | null>,
  cache: ReadonlyMap<string, Entry>,
): Map<string, Entry> {
  const result = new Map<string, Entry>();

  for (const url of urls) {
    const entry = url ? cache.get(url) : undefined;

    if (url && entry !== undefined) {
      result.set(url, entry);
    }
  }

  return result;
}

/**
 * Дозагрузка справочника перед сборкой PDF: карточки классов и подклассов
 * (ячейки заклинаний, умения по уровням, заклинательная характеристика),
 * заклинаний и описания предметов. В документе листа их нет — на сайте они
 * приходят с сервера, пока открыт лист.
 *
 * Функция никогда не выбрасывает: что не загрузилось, того не будет в листе,
 * но сам лист соберётся.
 *
 * @param document документ листа.
 * @returns загруженные записи по адресам.
 */
export async function loadPdfCatalog(
  document: SheetDocument,
): Promise<PdfCatalog> {
  const classUrls = document.classes.flatMap((sheetClass) => [
    sheetClass.url,
    sheetClass.archetypeUrl,
  ]);

  const spellUrls = document.spells.map((spell) => spell.url);
  const itemUrls = document.inventory.map((item) => item.url);

  await Promise.all([
    processInBatches(getPendingUrls(classUrls, classCache), async (url) => {
      const detail = await fetchCatalogSafe(url, sheetClassDetailSchema);

      if (detail) {
        classCache.set(url, detail);
      }
    }),

    processInBatches(getPendingUrls(spellUrls, spellCache), async (url) => {
      const detail = await fetchCatalogSafe(url, spellDetailSchema);

      if (detail) {
        spellCache.set(url, detail);
      }
    }),

    processInBatches(getPendingUrls(itemUrls, itemCache), async (url) => {
      const detail = await fetchCatalogSafe(url, itemDescriptionSchema);

      if (detail?.description) {
        itemCache.set(url, detail.description);
      }
    }),
  ]);

  return {
    classes: pickCached(classUrls, classCache),
    spells: pickCached(spellUrls, spellCache),
    items: pickCached(itemUrls, itemCache),
  };
}
