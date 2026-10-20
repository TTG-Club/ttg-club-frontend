/**
 * Документы живут на сайте новой редакции, общем для обоих сайтов:
 * регистрация идёт через один и тот же сервис авторизации.
 */
const LEGAL_DOCUMENTS_SITE_URL = 'https://new.ttg.club';

export const PUBLIC_OFFER_URL = `${LEGAL_DOCUMENTS_SITE_URL}/offer`;

export const PRIVACY_POLICY_URL = `${LEGAL_DOCUMENTS_SITE_URL}/privacy`;

/**
 * Редакции документов уходят в сервис авторизации вместе с согласиями.
 * Должны совпадать с датами редакций на new.ttg.club
 * (`PUBLIC_OFFER_UPDATED_AT` и `PRIVACY_POLICY_UPDATED_AT` в core-app).
 */
export const PUBLIC_OFFER_VERSION = '2026-10-09';

export const PRIVACY_POLICY_VERSION = '2026-09-18';
