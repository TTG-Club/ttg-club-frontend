import { describe, expect, it } from 'vitest';

import {
  countCommentDescendants,
  createCommentNode,
  findCommentNode,
  getCommentErrorMessage,
  getCommentIdFromHash,
  getCommentRateLimit,
  getCommentsTarget,
  getPluralWord,
  getTokenSubject,
  isCommentFromThread,
  isCommentTombstone,
  normalizeCommentDate,
  parseCommentReplies,
  parseCommentsPage,
  parseLatestComment,
  removeCommentNode,
} from '~comments/model';

/** Комментарий из ответа сервиса. */
function makeRawComment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    sourcePlatform: 'SITE_5E14',
    section: 'spells',
    url: '/spells/fireball',
    parentId: null,
    authorId: 'user-1',
    authorName: 'Магистр',
    content: 'Текст',
    status: 'PUBLISHED',
    replyCount: 0,
    createdAt: '2026-10-20T10:00:00Z',
    ...overrides,
  };
}

/**
 * JWT с заданным телом; подпись не проверяется.
 * @param payload - тело токена
 */
function makeToken(payload: object): string {
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `header.${body}.signature`;
}

describe('комментарии', () => {
  it('находит тред по адресу записи', () => {
    expect(getCommentsTarget('/spells/fireball')).toEqual({
      section: 'spells',
      url: '/spells/fireball',
    });

    expect(getCommentsTarget('/items/magic/bag?x=1#comment-5')).toEqual({
      section: 'magic-items',
      url: '/items/magic/bag',
    });

    expect(getCommentsTarget('https://ttg.club/items/rope/')).toEqual({
      section: 'items',
      url: '/items/rope',
    });
  });

  it('не заводит тред у списков, вложенных адресов и чужих разделов', () => {
    expect(getCommentsTarget('/spells')).toBeNull();
    expect(getCommentsTarget('/items/magic')).toBeNull();
    expect(getCommentsTarget('/classes/fighter/champion')).toBeNull();
    expect(getCommentsTarget('/tools/initiative/abc')).toBeNull();
    expect(getCommentsTarget(`/spells/${'a'.repeat(300)}`)).toBeNull();
  });

  it('достаёт комментарий из якоря', () => {
    expect(getCommentIdFromHash('#comment-42')).toBe('42');
    expect(getCommentIdFromHash('#comment-')).toBeUndefined();
    expect(getCommentIdFromHash('#description')).toBeUndefined();
  });

  it('читает пользователя из токена', () => {
    expect(getTokenSubject(makeToken({ sub: 'user-1' }))).toBe('user-1');
    expect(getTokenSubject(makeToken({ name: 'x' }))).toBe('');
    expect(getTokenSubject('broken')).toBe('');
    expect(getTokenSubject(null)).toBe('');
  });

  it('приводит даты Jackson к ISO', () => {
    expect(normalizeCommentDate([2026, 10, 20, 10, 5, 0])).toBe(
      '2026-10-20T10:05:00.000Z',
    );

    expect(normalizeCommentDate(0)).toBe('1970-01-01T00:00:00.000Z');

    expect(normalizeCommentDate('2026-10-20T10:00:00Z')).toBe(
      '2026-10-20T10:00:00Z',
    );
  });

  it('отсеивает битые комментарии поштучно и узнаёт надгробия', () => {
    const page = parseCommentsPage({
      content: [
        makeRawComment(),
        { content: 'без id' },
        makeRawComment({ id: 'c2', status: 'DELETED', content: null }),
      ],
      totalElements: 3,
      last: true,
    });

    expect(page.items.map((comment) => comment.id)).toEqual(['c1', 'c2']);
    expect(page.items.map(isCommentTombstone)).toEqual([false, true]);
  });

  it('сортирует ответы от старых к новым', () => {
    const replies = parseCommentReplies([
      makeRawComment({ id: 'new', createdAt: '2026-10-21T10:00:00Z' }),
      makeRawComment({ id: 'old', createdAt: '2026-10-19T10:00:00Z' }),
    ]);

    expect(replies.map((reply) => reply.id)).toEqual(['old', 'new']);
  });

  it('понимает пустой ответ /latest', () => {
    expect(parseLatestComment('')).toBeNull();
    expect(parseLatestComment(null)).toBeNull();
    expect(parseLatestComment(makeRawComment())?.id).toBe('c1');
  });

  it('собирает и правит дерево', () => {
    const root = createCommentNode(
      parseCommentsPage({
        content: [makeRawComment({ replyCount: 1, totalReplyCount: 2 })],
      }).items[0]!,
    );

    expect(root.repliesLoaded).toBe(false);
    expect(countCommentDescendants(root)).toBe(2);

    const [reply] = parseCommentReplies([
      makeRawComment({ id: 'r1', parentId: 'c1' }),
    ]);

    root.replies = [createCommentNode(reply!)];
    root.repliesLoaded = true;

    expect(countCommentDescendants(root)).toBe(1);
    expect(findCommentNode([root], 'r1')?.comment.id).toBe('r1');
    expect(removeCommentNode([root], 'r1')).toBe(true);
    expect(root.replies).toHaveLength(0);
  });

  it('не пускает комментарий из чужого треда', () => {
    const [comment] = parseCommentReplies([makeRawComment()]);
    const target = { section: 'spells', url: '/spells/fireball' };

    expect(isCommentFromThread(comment!, target)).toBe(true);

    expect(
      isCommentFromThread(comment!, { section: 'spells', url: '/spells/x' }),
    ).toBe(false);

    const [foreign] = parseCommentReplies([
      makeRawComment({ sourcePlatform: 'SITE_5E24' }),
    ]);

    expect(isCommentFromThread(foreign!, target)).toBe(false);
  });

  it('разбирает ошибки сервиса', () => {
    const rateLimited = {
      statusCode: 429,
      data: { detail: 'Слишком часто', retryAfterSeconds: 12 },
    };

    expect(getCommentErrorMessage(rateLimited)).toBe('Слишком часто');

    expect(getCommentRateLimit(rateLimited)).toEqual({
      retryAfterSeconds: 12,
      blocked: false,
    });

    expect(
      getCommentRateLimit({
        statusCode: 429,
        data: null,
        response: { headers: new Headers({ 'retry-after': '7' }) },
      }).retryAfterSeconds,
    ).toBe(7);
  });

  it('склоняет счётчики', () => {
    const forms = { one: 'ответ', few: 'ответа', many: 'ответов' };

    expect(getPluralWord(1, forms)).toBe('ответ');
    expect(getPluralWord(3, forms)).toBe('ответа');
    expect(getPluralWord(11, forms)).toBe('ответов');
  });
});
