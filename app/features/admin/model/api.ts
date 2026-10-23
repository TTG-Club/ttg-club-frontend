import type { YoutubeCreateData } from './schemas';
import type { YoutubeVideo, YoutubeVideoPage } from './types';

import {
  YOUTUBE_ACTIVE_PATH,
  YOUTUBE_API_PATH,
  YOUTUBE_COUNT_PATH,
  YOUTUBE_ORDER,
} from './constants';
import {
  parseYoutubeCount,
  parseYoutubeVideo,
  parseYoutubeVideoPage,
} from './schemas';

/**
 * Страница роликов, свежие сверху.
 * @param page - номер страницы с нуля
 * @param size - роликов на странице
 */
export async function fetchYoutubeVideos(
  page: number,
  size: number,
): Promise<YoutubeVideoPage> {
  const response: unknown = await $fetch(YOUTUBE_API_PATH, {
    query: { page, size, order: YOUTUBE_ORDER },
  });

  return parseYoutubeVideoPage(response);
}

/** Сколько роликов сейчас на главной. */
export async function fetchActiveYoutubeCount(): Promise<number> {
  const response: unknown = await $fetch(YOUTUBE_COUNT_PATH, {
    query: { active: true },
  });

  return parseYoutubeCount(response);
}

/**
 * Добавляет ролик.
 * @param video - ID и название
 */
export async function createYoutubeVideo(
  video: YoutubeCreateData,
): Promise<YoutubeVideo> {
  const response: unknown = await $fetch(YOUTUBE_API_PATH, {
    method: 'POST',
    body: video,
  });

  return parseYoutubeVideo(response);
}

/**
 * Сохраняет ролик целиком: бэкенд принимает его со всеми полями.
 * @param video - ролик с новым названием
 */
export async function updateYoutubeVideo(
  video: YoutubeVideo,
): Promise<YoutubeVideo> {
  const response: unknown = await $fetch(YOUTUBE_API_PATH, {
    method: 'PATCH',
    body: video,
  });

  return parseYoutubeVideo(response);
}

/**
 * Удаляет ролик.
 * @param videoId - ID ролика
 */
export async function deleteYoutubeVideo(videoId: string): Promise<void> {
  await $fetch(YOUTUBE_API_PATH, {
    method: 'DELETE',
    query: { id: videoId },
  });
}

/**
 * Включает или выключает показ ролика на главной.
 * @param videoId - ID ролика
 * @param isActive - показывать ли ролик
 */
export async function setYoutubeVideoActive(
  videoId: string,
  isActive: boolean,
): Promise<void> {
  await $fetch(YOUTUBE_ACTIVE_PATH, {
    method: 'PATCH',
    query: { id: videoId, activeStatus: isActive },
  });
}
