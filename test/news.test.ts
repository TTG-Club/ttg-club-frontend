import { describe, expect, it } from 'vitest';

import { getMarkupText, parseStoredMarkup } from '~news/markup';
import {
  getNewsCover,
  getNewsListUrl,
  getNewsMeta,
  getNewsPageUrl,
  getNewsPreviewText,
  NEWS_FALLBACK_IMAGE,
  parseNewsDetailed,
  parseNewsList,
  toNewsMarkup,
} from '~news/model';

const SITE = 'https://new.ttg.club';

describe('разбор новостей core-api', () => {
  it('берёт из списка только целые новости', () => {
    const list = parseNewsList([
      {
        id: '1',
        url: 'news',
        title: 'Новость',
        typeName: 'Новость',
        previewImageUrl: '',
        videoUrl: null,
        publishDateTime: '2026-11-10T10:00:00Z',
        preview: '["Анонс"]',
      },
      { id: '2', url: '', title: 'без слага' },
    ]);

    expect(list).toHaveLength(1);

    expect(list[0]).toMatchObject({
      url: 'news',
      previewImageUrl: null,
      authorName: null,
    });
  });

  it('не падает на ответе не-списком', () => {
    expect(() => parseNewsList(null)).toThrow();
  });

  it('разбирает полную новость сообщества', () => {
    const news = parseNewsDetailed({
      id: '1',
      url: 'n',
      title: 'Т',
      authorName: 'Автор',
      sourceUrl: 'https://example.com',
      previewImageUrl: null,
      videoUrl: null,
      publishDateTime: null,
      preview: null,
      content: ['Текст'],
    });

    expect(news.sourceUrl).toBe('https://example.com');
    expect(getMarkupText(toNewsMarkup(news.content))).toBe('Текст');
  });
});

describe('хранимая разметка', () => {
  it('оставляет абзац с маркерами одним абзацем', () => {
    expect(
      parseStoredMarkup('["Короткий {@b анонс} новости", "Второй"]'),
    ).toEqual(['Короткий {@b анонс} новости', 'Второй']);
  });

  it('не трогает обычную разметку и текст, похожий на JSON', () => {
    expect(parseStoredMarkup('{@b жирный}')).toBe('{@b жирный}');
    expect(parseStoredMarkup('[15')).toBe('[15');
  });
});

describe('вид новости', () => {
  it('разворачивает сырую JSON-строку анонса', () => {
    expect(getNewsPreviewText('["Привет, {@b мир}"]')).toBe('Привет, мир');
  });

  it('подставляет заглушку без обложки', () => {
    expect(getNewsCover({ previewImageUrl: null, videoUrl: null })).toBe(
      NEWS_FALLBACK_IMAGE,
    );
  });

  it('пишет автора и дату через точку', () => {
    expect(
      getNewsMeta({
        authorName: 'Автор',
        publishDateTime: '2026-11-10T10:00:00Z',
      }),
    ).toBe('Автор · 10 ноября 2026 г.');

    expect(getNewsMeta({ authorName: null, publishDateTime: null })).toBe('');
  });

  it('ведёт на страницы нового сайта', () => {
    expect(getNewsPageUrl('site', 'first', SITE)).toBe(
      'https://new.ttg.club/articles/first',
    );

    expect(getNewsPageUrl('community', 'second', SITE)).toBe(
      'https://new.ttg.club/community-news/second',
    );

    expect(getNewsListUrl('site', SITE)).toBe('https://new.ttg.club/news');
  });
});
