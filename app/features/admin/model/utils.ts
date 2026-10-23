import { YOUTUBE_ID_PATTERN, YOUTUBE_URL_ID_PATTERN } from './constants';

/**
 * ID ролика из ссылки YouTube или сам ID.
 * @param value - ссылка или ID
 * @returns ID либо `undefined`, если его не найти
 */
export function extractYoutubeId(value: string): string | undefined {
  const trimmed = value.trim();

  if (YOUTUBE_ID_PATTERN.test(trimmed)) {
    return trimmed;
  }

  return YOUTUBE_URL_ID_PATTERN.exec(trimmed)?.[1];
}

/**
 * Число страниц списка.
 * @param total - всего роликов
 * @param size - роликов на странице
 */
export function getPageCount(total: number, size: number): number {
  return size > 0 ? Math.ceil(total / size) : 0;
}

/**
 * Можно ли включить ролик на главной: выключить можно всегда, включить —
 * пока не достигнут предел.
 * @param isActive - показывается ли ролик сейчас
 * @param activeCount - сколько роликов на главной
 * @param limit - предел главной
 */
export function canToggleVideo(
  isActive: boolean,
  activeCount: number,
  limit: number,
): boolean {
  return isActive || activeCount < limit;
}
