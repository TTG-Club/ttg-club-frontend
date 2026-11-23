import type { SpellDetail } from '~character/model';

import { spellDetailSchema } from '~character/model';

import { fetchCatalogEntry } from '../model';

/**
 * Карточки заклинаний справочника для листа: урон для плиток и данные для
 * своей копии. В листе их нет — заклинание хранит только ссылку, а урон
 * правится в мастерской, — поэтому карточки догружаются и живут, пока
 * открыт лист. Ошибка одной карточки оставляет заклинание без урона.
 */
export const useSpellDetails = createSharedComposable(() => {
  const details = shallowRef<ReadonlyMap<string, SpellDetail>>(new Map());

  /** Уже запрошенные адреса: повторные запросы в полёте не нужны. */
  const requested = new Set<string>();

  /**
   * Карточка заклинания, загружая её при необходимости.
   * @param url - адрес заклинания
   */
  async function load(url: string): Promise<SpellDetail> {
    const cached = details.value.get(url);

    if (cached) {
      return cached;
    }

    const detail = await fetchCatalogEntry(url, spellDetailSchema);

    details.value = new Map(details.value).set(url, detail);

    return detail;
  }

  /**
   * Догружает карточки, которые ещё не запрашивались.
   * @param urls - адреса заклинаний
   */
  function ensure(urls: ReadonlyArray<string>): void {
    if (import.meta.server) {
      return;
    }

    for (const url of urls) {
      if (requested.has(url)) {
        continue;
      }

      requested.add(url);
      load(url).catch(() => undefined);
    }
  }

  /**
   * Загруженная карточка.
   * @param url - адрес заклинания
   */
  function get(url: string | null): SpellDetail | undefined {
    return url ? details.value.get(url) : undefined;
  }

  return { ensure, get, load };
});
