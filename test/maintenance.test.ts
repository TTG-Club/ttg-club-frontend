import { describe, expect, it } from 'vitest';

import {
  isMaintenancePageRequest,
  maintenanceSiteSettingsSchema,
} from '#shared/utils';

const HTML_ACCEPT = 'text/html,application/xhtml+xml';

describe('isMaintenancePageRequest', () => {
  it('считает страницами обычные адреса сайта', () => {
    expect(isMaintenancePageRequest('GET', '/', HTML_ACCEPT)).toBe(true);
    expect(isMaintenancePageRequest('GET', '/spells/fireball', '')).toBe(true);
    expect(isMaintenancePageRequest('HEAD', '/bestiary', '')).toBe(true);
    expect(isMaintenancePageRequest('GET', '/__nuxt_error', '')).toBe(true);
  });

  it('пропускает API, сборку и острова Nuxt', () => {
    expect(isMaintenancePageRequest('GET', '/api/v1/user/info', '')).toBe(
      false,
    );

    expect(isMaintenancePageRequest('GET', '/api/maintenance', '')).toBe(false);

    expect(isMaintenancePageRequest('GET', '/_nuxt/entry.js', '')).toBe(false);

    expect(
      isMaintenancePageRequest(
        'GET',
        '/s3/5e14/classes/Bard.webp',
        'text/html',
      ),
    ).toBe(false);

    expect(
      isMaintenancePageRequest('GET', '/__nuxt_island/Comp.json', ''),
    ).toBe(false);
  });

  it('пропускает запросы, которыми страницы не открывают', () => {
    expect(isMaintenancePageRequest('POST', '/', HTML_ACCEPT)).toBe(false);
  });

  it('файл — не страница, если браузер не открывает его как страницу', () => {
    expect(isMaintenancePageRequest('GET', '/robots.txt', '*/*')).toBe(false);

    expect(isMaintenancePageRequest('GET', '/robots.txt', HTML_ACCEPT)).toBe(
      true,
    );
  });
});

describe('maintenanceSiteSettingsSchema', () => {
  it('принимает ответ core-app без лишних полей', () => {
    expect(
      maintenanceSiteSettingsSchema.parse({
        enabled: false,
        title: 'Заголовок',
        message: 'Текст',
        updatedBy: 'admin',
      }),
    ).toEqual({ enabled: false, title: 'Заголовок', message: 'Текст' });
  });

  it('отклоняет ответ чужого формата', () => {
    expect(
      maintenanceSiteSettingsSchema.safeParse({ enabled: 'no' }).success,
    ).toBe(false);
  });
});
