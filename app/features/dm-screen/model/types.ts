import type { DmScreenSnapPickerPosition } from './schema';

/**
 * Точка в px: на поле ширмы (место окон), на холсте — его видимой части, от
 * её левого верхнего угла, — либо в окне браузера.
 */
export interface DmScreenPoint {
  x: number;
  y: number;
}

/** Размер окна или холста, px. */
export interface DmScreenSize {
  width: number;
  height: number;
}

/**
 * Сетка окон: сколько в ней колонок и рядов. Тем же видом записана клетка
 * поля выбора сетки — её колонка и ряд, считая с единицы.
 */
export interface DmScreenGrid {
  columns: number;
  rows: number;
}

/**
 * Стороны окна, за которые его тянут, меняя размер: `-1` — левая или
 * верхняя, `1` — правая или нижняя, `0` — сторона на месте.
 */
export interface DmScreenResizeEdges {
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
}

/**
 * Место в раскладке окон: доли свободного места холста, от 0 до 1.
 */
export interface DmScreenSnapZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Раскладка окон: на какие места делится холст. */
export interface DmScreenSnapLayout {
  key: string;
  zones: ReadonlyArray<DmScreenSnapZone>;
}

/** Вариант места панели раскладок в её настройках. */
export interface DmScreenSnapPickerOption {
  value: DmScreenSnapPickerPosition;
  /** Подпись пункта в настройках. */
  label: string;
  icon: string;
}

/** Место раскладки, над которым держат окно. */
export interface DmScreenSnapTarget {
  layout: DmScreenSnapLayout;
  zone: DmScreenSnapZone;
}

/** Подбор окон в оставшиеся места раскладки. */
export interface DmScreenSnapAssist {
  /** Свободные места по порядку; первое заполняется сейчас. */
  pending: ReadonlyArray<DmScreenSnapZone>;
  /** Окна, которые уже стоят в раскладке. */
  placedIds: ReadonlyArray<string>;
}

/** Окно вдоль одной оси: его отрезок по оси и отрезок поперёк неё, px. */
export interface DmScreenAxisTile {
  id: string;
  start: number;
  end: number;
  crossStart: number;
  crossEnd: number;
}

/**
 * Общая граница соседних окон: промежуток сетки между ними. За неё тянут,
 * меняя размер окон по обе стороны сразу.
 */
export interface DmScreenDivider {
  key: string;
  /** Граница вертикальная: окна стоят слева и справа от неё. */
  isVertical: boolean;
  /** Где граница начинается по своей оси: конец окон перед ней, px. */
  position: number;
  /** Начало границы поперёк оси, px. */
  start: number;
  /** Конец границы поперёк оси, px. */
  end: number;
  /** Окна перед границей: слева или сверху. */
  leadingIds: ReadonlyArray<string>;
  /** Окна за границей: справа или снизу. */
  trailingIds: ReadonlyArray<string>;
}

/** Ручка растягивания окна: сторона или угол. */
export interface DmScreenResizeHandle {
  key: string;
  /** За какие стороны тянет ручка. */
  edges: DmScreenResizeEdges;
  /** Классы места, размера и курсора ручки. */
  class: string;
}

/** Отрезок окна по одной оси: начало и длина, px. */
export interface DmScreenSpan {
  start: number;
  size: number;
}

/** В каких пределах сторона окна двигается при растягивании. */
export interface DmScreenResizeLimits {
  /** Отрезок свободного места холста по этой оси: к его краям магнит. */
  area: DmScreenSpan;
  /** Меньше этого окно не сжимается, px. */
  minSize: number;
}

/** Прямоугольник на поле или на холсте, px. */
export interface DmScreenRect extends DmScreenPoint, DmScreenSize {}

/** Место и размер окна, разложенного по сетке. */
export interface DmScreenTile extends DmScreenPoint, DmScreenSize {
  id: string;
}

/** Раздел, чьи записи открываются в ширме. */
export interface DmScreenSection {
  /** Ключ раздела: по нему ищется загруженная запись. */
  key: string;
  /** Адрес раздела — начало адреса его записей. */
  path: string;
  /** Иконка раздела, как в меню. */
  icon: string;
}

/** Просьба добавить запись в ширму. */
export interface DmScreenRequest {
  /** Адрес записи на сайте. */
  path: string;
  /** Название в шапке окна и на плашке свёрнутого окна. */
  title: string;
  /** Точка поля, рядом с которой встаёт окно; без неё — по центру холста. */
  origin?: DmScreenPoint;
}
