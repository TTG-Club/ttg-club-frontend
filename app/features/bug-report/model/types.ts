import type { BUG_REPORT_TYPES, DRAWING_TOOLS } from './constants';

/** Что отправляется: баг или пожелание. */
export type BugReportType = (typeof BUG_REPORT_TYPES)[number];

/** Тексты окна и тоста под тип записи. */
export interface BugReportTypeText {
  title: string;
  description: string;
  descriptionPlaceholder: string;
  sent: string;
  sentDescription: string;
}

/** Выделенный текст и его окружение на странице. */
export interface TextSelection {
  /** Текст до выделения. */
  before: string;
  /** Выделенный текст. */
  selected: string;
  /** Текст после выделения. */
  after: string;
}

/** Тело репорта, которое сервис ждёт в части `request`. */
export interface BugReportRequest {
  description: string;
  url?: string;
  sourcePlatform: string;
  /** Ключ гостя; вошедшего сервис узнаёт по токену. */
  sessionId?: string;
  selectedText?: string;
  /** Без него сервис считает запись багом. */
  type?: BugReportType;
}

/** Цвет кисти. */
export interface BrushColor {
  name: string;
  value: string;
}

/** Инструмент рисования на скриншоте. */
export type DrawingTool = (typeof DRAWING_TOOLS)[number];

/** Точка на холсте в CSS-пикселях. */
export interface CanvasPoint {
  x: number;
  y: number;
}

/** Пометка на скриншоте. */
export interface Stroke {
  color: string;
  size: number;
  tool: DrawingTool;
  points: CanvasPoint[];
}
