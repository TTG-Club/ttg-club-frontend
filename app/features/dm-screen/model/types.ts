/** Точка на экране, px. */
export interface DmScreenPoint {
  x: number;
  y: number;
}

/** Размер окна или экрана, px. */
export interface DmScreenSize {
  width: number;
  height: number;
}

/**
 * Экран ширмы: его размер и где кончается шапка ширмы. Без `top` шапка
 * считается обычной высоты.
 */
export interface DmScreenViewport extends DmScreenSize {
  /** Нижний край шапки ширмы, px: выше окна не встают. */
  top?: number;
}

/**
 * Стороны окна, за которые его тянут, меняя размер: `-1` — левая или
 * верхняя, `1` — правая или нижняя, `0` — сторона на месте.
 */
export interface DmScreenResizeEdges {
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
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

/** Границы, в которых сторона окна двигается при растягивании, px. */
export interface DmScreenResizeLimits {
  /** Дальше этого начало окна не уходит. */
  min: number;
  /** Край холста, к которому примагничивается начало окна. */
  snapMin: number;
  /** Край холста, к которому примагничивается конец окна. */
  snapMax: number;
  /** Меньше этого окно не сжимается. */
  minSize: number;
}

/** Прямоугольник окна на экране, px. */
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
  /** Точка клика: окно встаёт рядом с ней, а не в центре экрана. */
  origin?: DmScreenPoint;
}
