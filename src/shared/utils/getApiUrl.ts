export type ApiVersion = 'auth' | 'v1' | 'v2';

export const getProxyUrl = () => (import.meta.env.DEV ? '/proxy' : '');

export const getBaseUrl = (version: ApiVersion = 'v1') => {
  if (version === 'auth') {
    return `${getProxyUrl()}/api`;
  }

  return `${getProxyUrl()}/api/${version}`;
};

/**
 * Базовый URL для subscriber-service (источник истины по подпискам/промокодам).
 *
 * В dev обращения идут через отдельный proxy `/subscriber` (см. vite.config.ts),
 * который проксирует на VITE_SUBSCRIBER_SERVICE_URL и сохраняет SSO-JWT.
 * В prod всё ходит через единый api-gateway/nginx, поэтому достаточно
 * относительного пути.
 */
export const getSubscriberBaseUrl = () =>
  import.meta.env.DEV ? '/subscriber/api' : '/api';
