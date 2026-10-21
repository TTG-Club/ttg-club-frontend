import type { SourcePlatform } from '@/shared/const/platform';

/** Контекст выделенного текста для баг-репорта */
export interface TextSelection {
  /** Текст до выделения (~50 символов контекста) */
  before: string;

  /** Выделенный пользователем текст */
  selected: string;

  /** Текст после выделения (~50 символов контекста) */
  after: string;
}

/** Запрос на создание баг-репорта для API */
export interface BugReportCreateRequest {
  /** Описание бага */
  description: string;

  /** URL страницы, на которой обнаружен баг */
  url?: string;

  /** Платформа-источник бага */
  sourcePlatform: SourcePlatform;

  /** Идентификатор сессии (если не авторизован) */
  sessionId?: string;

  /** Выделенный текст на странице */
  selectedText?: string;
}

/** Цвет кисти для рисования на скриншоте */
export interface BrushColor {
  /** Уникальное название цвета */
  name: string;

  /** CSS-значение цвета */
  value: string;
}
