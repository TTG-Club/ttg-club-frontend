import { NEW_SITE_URL } from '~/shared/consts';

import {
  MENU_CONTACT_LINKS,
  MENU_SUPPORT_LINKS,
} from '../../sidebar/menu/model';

/** Ссылка на юридический документ в подвале. */
interface FooterLegalLink {
  label: string;
  url: string;
  icon: string;
}

/** Соцсети в подвале — те же, что в меню. */
export const FOOTER_SOCIAL_LINKS = MENU_CONTACT_LINKS;

/** Поддержка проекта в подвале: только основной Boosty. */
export const FOOTER_SUPPORT_LINKS = MENU_SUPPORT_LINKS.slice(0, 1);

/** Почта службы поддержки. */
export const FOOTER_SUPPORT_EMAIL = 'support@ttg.club';

/** Ссылка mailto на почту службы поддержки. */
export const FOOTER_SUPPORT_EMAIL_HREF = `mailto:${FOOTER_SUPPORT_EMAIL}`;

/** Иконка почты службы поддержки. */
export const FOOTER_SUPPORT_EMAIL_ICON = 'tabler:mail';

/**
 * Юридические документы живут на new.ttg.club: они общие для обоих сайтов,
 * своих страниц у этого сайта нет.
 */
export const FOOTER_LEGAL_LINKS: Array<FooterLegalLink> = [
  {
    label: 'Политика конфиденциальности',
    url: `${NEW_SITE_URL}/privacy`,
    icon: 'tabler:shield-lock',
  },
  {
    label: 'Файлы cookie',
    url: `${NEW_SITE_URL}/cookies`,
    icon: 'tabler:cookie',
  },
  {
    label: 'Пользовательское соглашение',
    url: `${NEW_SITE_URL}/terms`,
    icon: 'tabler:file-certificate',
  },
  {
    label: 'Публичная оферта',
    url: `${NEW_SITE_URL}/offer`,
    icon: 'tabler:file-text',
  },
];

/** Текст копирайта. */
export const FOOTER_COPYRIGHT = `© 2022–${new Date().getFullYear()} TTG Club`;

/** Дисклеймер о правах. */
export const FOOTER_DISCLAIMER =
  'Материалы представлены для ознакомления. Права на материалы Wizards of the Coast принадлежат Wizards of the Coast.';
