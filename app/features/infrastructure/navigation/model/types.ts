/** Пункт меню сайта. */
export interface MenuItem {
  label: string;
  href: string;
  /** Иконка слева от подписи. */
  icon: string;
  /** Пункт ведёт на другой сайт и открывается в новой вкладке. */
  external?: boolean;
  /**
   * Пункт стоит и на главной: раздел — плиткой, инструмент — в ленте под
   * поиском.
   */
  onHome?: boolean;
}

/** Раздел меню с заголовком. */
export interface MenuSection {
  label: string;
  items: Array<MenuItem>;
  /**
   * Раздел инструментов: самый длинный, на широком меню стоит справа во
   * весь рост, чтобы меню было ниже.
   */
  isTools?: boolean;
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
