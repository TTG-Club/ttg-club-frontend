/** Пункт меню в том виде, в каком его отдаёт `GET /api/v1/menu`. */
export interface SiteMenuItem {
  name: string;
  icon?: string;
  url?: string;
  onlyDev?: boolean;
  external?: boolean;
  order: number;
  /** Пункт стоит плиткой на главной. */
  onIndex?: boolean;
  /** Порядок плитки на главной. */
  indexOrder?: number;
  children?: Array<SiteMenuItem>;
}

/** Ссылка в группе меню. */
export interface MenuLink {
  label: string;
  /** Пусто у пункта-заглушки, который ещё никуда не ведёт. */
  url?: string;
  external: boolean;
}

/** Группа меню с заголовком и иконкой. */
export interface MenuGroup {
  label: string;
  icon?: string;
  links: Array<MenuLink>;
}

/** Ссылка на соцсеть в подвале меню и в боковой панели. */
export interface SocialLink {
  label: string;
  url: string;
  icon: string;
}

/** Ссылка на поддержку проекта. */
export interface SupportLink extends SocialLink {
  /** Подпись рядом с иконкой. */
  title: string;
}
