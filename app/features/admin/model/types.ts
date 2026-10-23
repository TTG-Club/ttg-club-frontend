/** Ролик YouTube-канала в админке. */
export interface YoutubeVideo {
  id: string;
  name: string;
  /** Показывается ли ролик на главной. */
  active: boolean;
  /** Дата добавления; пустая строка, если бэкенд её не прислал. */
  created: string;
  order: number;
}

/** Страница роликов. */
export interface YoutubeVideoPage {
  items: Array<YoutubeVideo>;
  total: number;
}
