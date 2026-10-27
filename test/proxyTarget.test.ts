import { describe, expect, it } from 'vitest';

import { getProxyTarget, isPathWithPrefix } from '#shared/utils';

const upstreams = {
  api: 'http://backend:8080/',
  subscriber: 'http://subscriber:3000',
  comments: 'http://comments:3000',
  core: 'http://core:8080',
};

describe('isPathWithPrefix', () => {
  it('совпадает с самим префиксом и вложенными путями', () => {
    expect(isPathWithPrefix('/api/v1/comments', ['/api/v1/comments'])).toBe(
      true,
    );

    expect(
      isPathWithPrefix('/api/v1/comments/42?page=1', ['/api/v1/comments']),
    ).toBe(true);
  });

  it('не совпадает с путём, который лишь начинается так же', () => {
    expect(
      isPathWithPrefix('/api/v1/comments-count', ['/api/v1/comments']),
    ).toBe(false);
  });
});

describe('getProxyTarget', () => {
  it('отправляет обычные запросы в основной API без двойного слэша', () => {
    expect(getProxyTarget('/api/v1/spells?page=2', upstreams)).toBe(
      'http://backend:8080/api/v1/spells?page=2',
    );
  });

  it('отправляет подписки и комментарии в их сервисы', () => {
    expect(getProxyTarget('/api/subscriptions/status', upstreams)).toBe(
      'http://subscriber:3000/api/subscriptions/status',
    );

    expect(getProxyTarget('/api/v1/comments/spells/fireball', upstreams)).toBe(
      'http://comments:3000/api/v1/comments/spells/fireball',
    );
  });

  it('отправляет новости в core-api', () => {
    expect(getProxyTarget('/api/v2/articles/search?type=NEWS', upstreams)).toBe(
      'http://core:8080/api/v2/articles/search?type=NEWS',
    );
  });

  it('без адресов сервисов отправляет всё в основной API', () => {
    const onlyApi = {
      ...upstreams,
      subscriber: '',
      comments: '',
      core: '',
    };

    expect(getProxyTarget('/api/subscriptions/my', onlyApi)).toBe(
      'http://backend:8080/api/subscriptions/my',
    );

    expect(getProxyTarget('/api/v1/comments', onlyApi)).toBe(
      'http://backend:8080/api/v1/comments',
    );

    expect(getProxyTarget('/api/v2/articles/search', onlyApi)).toBe(
      'http://backend:8080/api/v2/articles/search',
    );
  });
});
