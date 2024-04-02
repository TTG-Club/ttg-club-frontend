export type ApiVersion = 'v1' | 'v2';

export const getProxyUrl = () => (import.meta.env.DEV ? '/proxy' : '');

export const getBaseUrl = (version: ApiVersion = 'v1') =>
  `${getProxyUrl()}/api/${version}`;
