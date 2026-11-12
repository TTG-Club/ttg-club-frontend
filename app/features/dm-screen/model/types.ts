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
