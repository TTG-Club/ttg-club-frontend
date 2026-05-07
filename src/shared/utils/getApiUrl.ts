export type ApiVersion = 'auth' | 'v1' | 'v2';

export const getProxyUrl = () => (import.meta.env.DEV ? '/proxy' : '');

export const getBaseUrl = (version: ApiVersion = 'v1') => {
  if (version === 'auth') {
    return `${getProxyUrl()}/api`;
  }

  return `${getProxyUrl()}/api/${version}`;
};
