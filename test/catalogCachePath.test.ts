import { describe, expect, it } from 'vitest';

// Сам файл, а не barrel: сервис рядом опирается на авто-импорты Nitro.
import {
  getCatalogCacheKey,
  isCatalogCacheReset,
  isCatalogRead,
} from '#server/domain/catalog-cache/utils/catalogCachePath';

const LIST_BODY = '{"page":0,"size":60,"search":{"value":"дракон"}}';

describe('isCatalogRead', () => {
  it('читает списки, записи и фильтры по POST и мета-данные по GET', () => {
    expect(isCatalogRead('POST', '/api/v1/bestiary')).toBe(true);
    expect(isCatalogRead('POST', '/api/v1/bestiary/goblin')).toBe(true);
    expect(isCatalogRead('POST', '/api/v1/items/magic')).toBe(true);
    expect(isCatalogRead('POST', '/api/v1/classes/wizard/evoker')).toBe(true);
    expect(isCatalogRead('POST', '/api/v1/filters/spells')).toBe(true);
    expect(isCatalogRead('GET', '/api/v1/meta/spells/fireball')).toBe(true);
  });

  it('не считает чтением мастерскую, личные разделы и инструменты', () => {
    expect(isCatalogRead('POST', '/api/v1/workshop/spells')).toBe(false);
    expect(isCatalogRead('GET', '/api/v1/workshop/books/PHB')).toBe(false);
    expect(isCatalogRead('GET', '/api/v1/bookmarks')).toBe(false);
    expect(isCatalogRead('GET', '/api/v1/user/sources')).toBe(false);
    expect(isCatalogRead('POST', '/api/v1/search/random')).toBe(false);
    expect(isCatalogRead('POST', '/api/v1/tools/treasury')).toBe(false);
    expect(isCatalogRead('GET', '/api/v2/articles')).toBe(false);
  });

  it('не считает чтением запись в раздел каталога и предпросмотр', () => {
    expect(isCatalogRead('PATCH', '/api/v1/spells/fireball')).toBe(false);
    expect(isCatalogRead('DELETE', '/api/v1/spells/fireball')).toBe(false);
    expect(isCatalogRead('POST', '/api/v1/spells/preview')).toBe(false);
  });
});

describe('getCatalogCacheKey', () => {
  it('не содержит символов, которые хранилище Nitro отрезает или заменяет', () => {
    // unstorage отбрасывает всё после `?` и меняет `/` и `\` на `:` — с такими
    // символами разные запросы к одному адресу делили бы одну запись кэша.
    const cacheKey = getCatalogCacheKey(
      'GET',
      '/api/v1/meta/bestiary?search=дракон&source=MM,PHB',
    );

    expect(cacheKey).toBeDefined();
    expect(cacheKey).not.toMatch(/[?/\\:]/);

    expect(decodeURIComponent(cacheKey ?? '')).toBe(
      'GET /api/v1/meta/bestiary?search=%D0%B4%D1%80%D0%B0%D0%BA%D0%BE%D0%BD&source=MM%2CPHB',
    );
  });

  it('различает тела запроса на чтение', () => {
    const firstPage = getCatalogCacheKey(
      'POST',
      '/api/v1/bestiary',
      '{"page":0,"size":60}',
    );

    const secondPage = getCatalogCacheKey(
      'POST',
      '/api/v1/bestiary',
      '{"page":1,"size":60}',
    );

    expect(firstPage).toBeDefined();
    expect(secondPage).toBeDefined();
    expect(firstPage).not.toBe(secondPage);
    expect(firstPage).not.toMatch(/[?/\\:]/);
  });

  it('сводит одинаковые запросы к одному ключу', () => {
    expect(getCatalogCacheKey('POST', '/api/v1/bestiary', LIST_BODY)).toBe(
      getCatalogCacheKey('POST', '/api/v1/bestiary', LIST_BODY),
    );

    expect(getCatalogCacheKey('GET', '/api/v1/meta/spells?b=2&a=1')).toBe(
      getCatalogCacheKey('GET', '/api/v1/meta/spells?a=1&b=2'),
    );
  });

  it('различает адреса и методы', () => {
    expect(getCatalogCacheKey('POST', '/api/v1/spells', LIST_BODY)).not.toBe(
      getCatalogCacheKey('POST', '/api/v1/bestiary', LIST_BODY),
    );

    expect(getCatalogCacheKey('GET', '/api/v1/meta/spells')).not.toBe(
      getCatalogCacheKey('POST', '/api/v1/meta/spells'),
    );
  });

  it('не кэширует то, что не читает каталог', () => {
    expect(
      getCatalogCacheKey('POST', '/api/v1/workshop/spells', LIST_BODY),
    ).toBe(undefined);

    expect(
      getCatalogCacheKey('POST', '/api/v1/spells/preview', LIST_BODY),
    ).toBe(undefined);

    expect(getCatalogCacheKey('GET', '/api/v1/auth')).toBe(undefined);
  });
});

describe('isCatalogCacheReset', () => {
  it('сбрасывает кэш при записи в мастерской', () => {
    expect(isCatalogCacheReset('POST', '/api/v1/workshop/spells')).toBe(true);

    expect(isCatalogCacheReset('PATCH', '/api/v1/workshop/spells/12')).toBe(
      true,
    );

    expect(
      isCatalogCacheReset(
        'POST',
        '/api/v1/workshop/spells/12/revisions/3/restore',
      ),
    ).toBe(true);

    expect(
      isCatalogCacheReset('DELETE', '/api/v1/workshop/images/CREATURE/12'),
    ).toBe(true);
  });

  it('сбрасывает кэш при заливке из JSON', () => {
    expect(isCatalogCacheReset('POST', '/api/v1/fspell')).toBe(true);
    expect(isCatalogCacheReset('POST', '/api/v1/fcreature')).toBe(true);
  });

  it('не сбрасывает кэш при чтении и предпросмотре', () => {
    expect(isCatalogCacheReset('POST', '/api/v1/bestiary')).toBe(false);

    expect(
      isCatalogCacheReset('GET', '/api/v1/workshop/spells/12/revisions'),
    ).toBe(false);

    expect(isCatalogCacheReset('POST', '/api/v1/workshop/spells/preview')).toBe(
      false,
    );
  });

  it('не сбрасывает кэш при записи вне каталога', () => {
    expect(isCatalogCacheReset('POST', '/api/v1/bookmarks')).toBe(false);
    expect(isCatalogCacheReset('PUT', '/api/v1/user/sources')).toBe(false);
    expect(isCatalogCacheReset('POST', '/api/v1/tools/treasury')).toBe(false);
  });
});
