import type { VideoSource } from './types';

import {
  VIDEO_VK_EMBED_BASE,
  VIDEO_VK_HOSTS,
  VIDEO_VK_WATCH_BASE,
  VIDEO_YOUTUBE_EMBED_BASE,
  VIDEO_YOUTUBE_HOSTS,
  VIDEO_YOUTUBE_THUMBNAIL_BASE,
  VIDEO_YOUTUBE_WATCH_BASE,
} from './constants';

/** Id ролика YouTube: 11 символов из латиницы, цифр, `-` и `_`. */
const YOUTUBE_ID_PATTERN = /^[\w-]{11}$/;

/** Отметка времени YouTube: `90`, `90s`, `1m30s`, `1h2m3s`. */
const YOUTUBE_TIME_PATTERN = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/;

/** Разделы адреса YouTube, за которыми сразу идёт id ролика. */
const YOUTUBE_ID_SEGMENTS: ReadonlyArray<string> = [
  'embed',
  'shorts',
  'live',
  'v',
];

/** Ролик или клип ВК в адресе: `video-123_456`, `clip123_456`. */
const VK_VIDEO_PATTERN = /(?:video|clip)(-?\d+)_(\d+)/;

/** Числовой id владельца или ролика ВК (у сообществ владелец с минусом). */
const VK_NUMERIC_ID_PATTERN = /^-?\d+$/;

/** Атрибут `src` во вставленном коде iframe. */
const IFRAME_SRC_PATTERN = /<iframe[^>]*\ssrc=["']([^"']+)["']/i;

/**
 * Достаёт адрес из того, что вставили в поле: саму ссылку или код iframe
 * (так ВК отдаёт ролики с ключом доступа). Сущности `&amp;` из кода
 * разворачиваются.
 */
function extractAddress(input: string): string {
  const trimmed = input.trim();
  const iframeSource = IFRAME_SRC_PATTERN.exec(trimmed)?.[1];

  return (iframeSource ?? trimmed).replaceAll('&amp;', '&');
}

/**
 * Разбирает адрес в `URL`. Ссылку без протокола (`youtu.be/…`) дополняет
 * `https://`; неразборчивую строку возвращает как `null`.
 */
function toUrl(address: string): URL | null {
  if (!address) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(address)
    ? address
    : `https://${address}`;

  try {
    return new URL(withProtocol);
  } catch {
    return null;
  }
}

/** Хост без `www.` и мобильного `m.` — для сверки со списками площадок. */
function getBareHost(url: URL): string {
  return url.hostname.toLowerCase().replace(/^(?:www\.|m\.)/, '');
}

/**
 * Переводит отметку времени YouTube (`t=90`, `t=1m30s`) в секунды.
 * Пустую или непонятную отметку возвращает как `0`.
 */
function parseYoutubeStart(value: string | null): number {
  const match = value ? YOUTUBE_TIME_PATTERN.exec(value) : null;

  if (!match) {
    return 0;
  }

  const [, hours = '0', minutes = '0', seconds = '0'] = match;

  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

/** Достаёт id ролика из ссылки YouTube любого вида. */
function getYoutubeId(url: URL): string | null {
  const segments = url.pathname.split('/').filter(Boolean);

  if (getBareHost(url) === 'youtu.be') {
    return segments[0] ?? null;
  }

  if (url.pathname === '/watch') {
    return url.searchParams.get('v');
  }

  const [section, value] = segments;

  return section && YOUTUBE_ID_SEGMENTS.includes(section)
    ? (value ?? null)
    : null;
}

/** Разбирает ссылку YouTube; чужую или битую возвращает как `null`. */
function parseYoutube(url: URL): VideoSource | null {
  const videoId = getYoutubeId(url);

  if (!videoId || !YOUTUBE_ID_PATTERN.test(videoId)) {
    return null;
  }

  const start = parseYoutubeStart(
    url.searchParams.get('t') ?? url.searchParams.get('start'),
  );

  const startSuffix = start > 0 ? `&t=${start}s` : '';
  const embedStartSuffix = start > 0 ? `&start=${start}` : '';

  return {
    provider: 'youtube',
    url: `${VIDEO_YOUTUBE_WATCH_BASE}?v=${videoId}${startSuffix}`,
    embedUrl: `${VIDEO_YOUTUBE_EMBED_BASE}/${videoId}?autoplay=1&rel=0${embedStartSuffix}`,
    thumbnailUrl: `${VIDEO_YOUTUBE_THUMBNAIL_BASE}/${videoId}/hqdefault.jpg`,
  };
}

/**
 * Достаёт владельца и id ролика ВК: из адреса плеера (`video_ext.php?oid=&id=`),
 * из пути (`/video-1_2`, `/clip-1_2`) или из параметра `z` (ролик, открытый
 * поверх ленты).
 */
function getVkIds(url: URL): { ownerId: string; videoId: string } | null {
  if (url.pathname === '/video_ext.php') {
    const ownerId = url.searchParams.get('oid') ?? '';
    const videoId = url.searchParams.get('id') ?? '';

    return VK_NUMERIC_ID_PATTERN.test(ownerId)
      && VK_NUMERIC_ID_PATTERN.test(videoId)
      ? { ownerId, videoId }
      : null;
  }

  const match =
    VK_VIDEO_PATTERN.exec(url.pathname)
    ?? VK_VIDEO_PATTERN.exec(url.searchParams.get('z') ?? '');

  return match?.[1] && match[2]
    ? { ownerId: match[1], videoId: match[2] }
    : null;
}

/**
 * Разбирает ссылку ВК Видео; чужую или битую возвращает как `null`. Ключ
 * доступа `hash` (есть в коде для вставки) сохраняется — без него закрытые
 * ролики не играют.
 */
function parseVk(url: URL): VideoSource | null {
  const ids = getVkIds(url);

  if (!ids) {
    return null;
  }

  const hash = url.searchParams.get('hash');
  const hashSuffix = hash ? `&hash=${encodeURIComponent(hash)}` : '';
  const playerQuery = `oid=${ids.ownerId}&id=${ids.videoId}${hashSuffix}`;

  return {
    provider: 'vk',
    // С ключом ссылка ведёт на плеер — иначе ключ потерялся бы при сохранении.
    url: hash
      ? `${VIDEO_VK_EMBED_BASE}?${playerQuery}`
      : `${VIDEO_VK_WATCH_BASE}${ids.ownerId}_${ids.videoId}`,
    embedUrl: `${VIDEO_VK_EMBED_BASE}?${playerQuery}&hd=2&autoplay=1`,
    thumbnailUrl: null,
  };
}

/**
 * Разбирает ссылку на ролик YouTube или ВК Видео (или код iframe с такой
 * ссылкой).
 *
 * @param input - Что вставили в поле: ссылка любого вида или код для вставки
 * @returns Площадка, нормализованная ссылка, адрес плеера и превью; `null`,
 *   если ссылка пустая или площадка не поддерживается
 */
export function parseVideoUrl(
  input: string | null | undefined,
): VideoSource | null {
  const url = toUrl(extractAddress(input ?? ''));

  if (!url) {
    return null;
  }

  const host = getBareHost(url);

  if (VIDEO_YOUTUBE_HOSTS.includes(host)) {
    return parseYoutube(url);
  }

  if (VIDEO_VK_HOSTS.includes(host)) {
    return parseVk(url);
  }

  return null;
}

/**
 * Заставка ролика для карточек: своя обложка записи, а без неё — превью
 * площадки (есть только у YouTube).
 *
 * @param videoUrl - Ссылка на ролик (может отсутствовать)
 * @param image - Загруженная обложка записи (может отсутствовать)
 * @returns Адрес картинки или `null`, если показать нечего
 */
export function getVideoPoster(
  videoUrl: string | null | undefined,
  image: string | null | undefined,
): string | null {
  if (image) {
    return image;
  }

  return parseVideoUrl(videoUrl)?.thumbnailUrl ?? null;
}
