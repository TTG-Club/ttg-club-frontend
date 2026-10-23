import { describe, expect, it } from 'vitest';

import {
  canToggleVideo,
  extractYoutubeId,
  getPageCount,
  parseYoutubeCount,
  parseYoutubeVideoPage,
  youtubeCreateSchema,
} from '~admin/model';

const VIDEO_ID = 'dQw4w9WgXcQ';

describe('админка роликов YouTube', () => {
  it.each([
    VIDEO_ID,
    `https://www.youtube.com/watch?v=${VIDEO_ID}&t=10s`,
    `https://youtu.be/${VIDEO_ID}?si=abc`,
    `https://www.youtube.com/shorts/${VIDEO_ID}`,
    `https://www.youtube.com/embed/${VIDEO_ID}`,
    `https://www.youtube.com/live/${VIDEO_ID}`,
  ])('достаёт ID из «%s»', (value) => {
    expect(extractYoutubeId(value)).toBe(VIDEO_ID);
  });

  it('не принимает чужие ссылки и обрывки ID', () => {
    expect(extractYoutubeId('https://example.com/video')).toBeUndefined();
    expect(extractYoutubeId('dQw4w9WgXc')).toBeUndefined();
  });

  it('считает страницы', () => {
    expect(getPageCount(0, 9)).toBe(0);
    expect(getPageCount(9, 9)).toBe(1);
    expect(getPageCount(10, 9)).toBe(2);
    expect(getPageCount(10, 0)).toBe(0);
  });

  it('не даёт включить ролик сверх предела главной, но даёт выключить', () => {
    expect(canToggleVideo(false, 4, 5)).toBe(true);
    expect(canToggleVideo(false, 5, 5)).toBe(false);
    expect(canToggleVideo(true, 5, 5)).toBe(true);
  });

  it('отбрасывает битые записи поштучно', () => {
    const page = parseYoutubeVideoPage({
      items: [
        { id: VIDEO_ID, name: 'Ролик', active: true, created: null, order: 1 },
        { name: 'Без ID' },
      ],
      total: '2',
    });

    expect(page.total).toBe(2);

    expect(page.items).toEqual([
      { id: VIDEO_ID, name: 'Ролик', active: true, created: '', order: 1 },
    ]);
  });

  it('читает счётчик главной и не падает на мусоре', () => {
    expect(parseYoutubeCount(3)).toBe(3);
    expect(parseYoutubeCount('x')).toBe(0);
  });

  it('превращает ссылку в форме в ID', () => {
    const parsed = youtubeCreateSchema.safeParse({
      id: ` https://youtu.be/${VIDEO_ID} `,
      name: ' Ролик ',
    });

    expect(parsed.success && parsed.data).toEqual({
      id: VIDEO_ID,
      name: 'Ролик',
    });

    expect(
      youtubeCreateSchema.safeParse({ id: 'не ссылка', name: 'Ролик' }).success,
    ).toBe(false);
  });
});
