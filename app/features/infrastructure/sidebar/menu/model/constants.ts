import type { MenuGroup, SocialLink, SupportLink } from './types';

/** Название сайта в шапке меню. */
export const MENU_SITE_TITLE = 'TTG Club';

/** Подпись под названием сайта в шапке меню. */
export const MENU_SITE_DESCRIPTION = 'Онлайн справочник по D&D 5e';

/** Подпись открывающей меню кнопки. */
export const MENU_TOGGLE_LABEL = 'Меню';

/** Текст, пока меню загружается или не загрузилось. */
export const MENU_ERROR_TEXT = 'Не удалось загрузить меню';

/** Число ссылок в группах скелетона меню, пока меню грузится. */
export const MENU_SKELETON_LINKS = [6, 4, 7, 5, 3, 6];

/** Подпись блока соцсетей в подвале меню. */
export const MENU_CONTACTS_LABEL = 'Контакты:';

/** Подпись блока поддержки в подвале меню. */
export const MENU_SUPPORT_LABEL = 'Поддержка:';

/** Префикс локальной коллекции иконок. */
export const TTG_ICON_PREFIX = 'ttg:';

/** Токенатор переехал на новый сайт. */
export const TOKENATOR_URL = 'https://new.ttg.club/tokenator';

/** Здешний токенатор: теперь его старая версия. */
export const TOKENATOR_LEGACY_URL = '/tools/tokenator';

/** Подпись старой версии токенатора. */
export const TOKENATOR_LEGACY_SUFFIX = ' (старая версия)';

/** Раздел Virtual TTG: в меню бэкенда его нет, как и в старом SPA. */
export const VTTG_MENU_GROUP: MenuGroup = {
  label: 'Virtual TTG',
  icon: 'ttg:menu-filled-information',
  links: [
    {
      label: 'Информация',
      url: 'https://new.ttg.club/vttg',
      external: true,
    },
  ],
};

/** Соцсети в подвале меню. */
export const MENU_CONTACT_LINKS: Array<SocialLink> = [
  { label: 'Telegram', url: 'https://t.me/ttgclubnews', icon: 'ttg:telegram' },
  { label: 'VK', url: 'https://vk.com/ttg.club', icon: 'ttg:vk' },
  {
    label: 'Discord',
    url: 'https://discord.gg/JqFKMKRtxv',
    icon: 'ttg:discord',
  },
  {
    label: 'YouTube',
    url: 'https://www.youtube.com/channel/UCpFse6-P2IBXYfkesAxZbfA',
    icon: 'ttg:youtube',
  },
];

/** Ссылки на поддержку проекта в подвале меню. */
export const MENU_SUPPORT_LINKS: Array<SupportLink> = [
  {
    label: 'Boosty TTG Club',
    title: 'TTG Club',
    url: 'https://boosty.to/dnd5club',
    icon: 'ttg:boosty',
  },
  {
    label: 'Boosty Magistrus',
    title: 'Magistrus',
    url: 'https://boosty.to/dnd5eclub',
    icon: 'ttg:boosty',
  },
];
