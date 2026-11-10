export type { SiteMenuItem } from '#shared/types';

/** Ссылка в группе меню. */
export interface MenuLink {
  label: string;
  /** Пусто у пункта-заглушки, который ещё никуда не ведёт. */
  url?: string;
  /** Иконка слева от подписи. */
  icon: string;
  external: boolean;
}

/** Группа меню с заголовком. */
export interface MenuGroup {
  label: string;
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
