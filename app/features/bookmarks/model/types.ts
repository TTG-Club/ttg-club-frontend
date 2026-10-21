/** Запись закладок в том виде, как её хранит API: группа, категория или ссылка. */
export interface BookmarkEntry {
  uuid: string;
  name: string;
  order: number;
  /** Пусто у группы. */
  parentUUID?: string;
  /** Есть только у ссылки. */
  url?: string;
}

/** Ссылка в категории. */
export interface BookmarkItem extends BookmarkEntry {
  parentUUID: string;
  url: string;
}

/** Категория (раздел сайта) с её ссылками. */
export interface BookmarkCategoryNode extends BookmarkEntry {
  children: Array<BookmarkItem>;
}

/** Группа с категориями. */
export interface BookmarkGroupNode extends BookmarkEntry {
  children: Array<BookmarkCategoryNode>;
}

/** Категория закладки по адресу страницы. */
export interface BookmarkCategoryInfo {
  name: string;
  code: string;
  order: number;
}
