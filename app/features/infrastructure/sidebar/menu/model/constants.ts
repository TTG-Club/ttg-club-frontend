import type { MenuGroup, SocialLink, SupportLink } from './types';

/** Название сайта в шапке меню. */
export const MENU_SITE_TITLE = 'TTG Club';

/** Подпись под названием сайта в шапке меню. */
export const MENU_SITE_DESCRIPTION = 'Онлайн справочник по D&D 5e';

/** Подпись открывающей меню кнопки. */
export const MENU_TOGGLE_LABEL = 'Меню';

/** Подпись блока соцсетей в подвале меню. */
export const MENU_CONTACTS_LABEL = 'Контакты:';

/** Подпись блока поддержки в подвале меню. */
export const MENU_SUPPORT_LABEL = 'Поддержка:';

/** Иконка пункта, который ведёт на другой сайт. */
export const MENU_EXTERNAL_ICON = 'tabler:external-link';

/** Иконка пункта, для адреса которого своей иконки нет. */
export const MENU_DEFAULT_ICON = 'tabler:point';

/**
 * Иконки пунктов по адресу: в меню из API иконки есть только у групп, а на
 * новом сайте они стоят у каждого пункта.
 */
export const MENU_LINK_ICONS: Record<string, string> = {
  '/classes': 'tabler:sword',
  '/races': 'tabler:users',
  '/feats': 'tabler:star',
  '/options': 'tabler:list-details',
  '/backgrounds': 'tabler:writing',
  '/spells': 'tabler:sparkles',
  '/weapons': 'tabler:axe',
  '/armors': 'tabler:shield',
  '/items': 'tabler:backpack',
  '/treasures': 'tabler:diamond',
  '/items/magic': 'tabler:wand',
  '/bestiary': 'tabler:paw',
  '/screens': 'tabler:layout-board-split',
  '/tools/ability-calc': 'tabler:calculator',
  '/tools/trader': 'tabler:building-store',
  '/tools/encounters': 'tabler:skull',
  '/tools/treasury': 'tabler:coins',
  '/tools/wildmagic': 'tabler:flame',
  '/tools/madness': 'tabler:brain',
  '/tools/tokenator': 'tabler:photo',
  'https://new.ttg.club/tokenator': 'tabler:photo-circle',
  '/tools/names': 'tabler:signature',
  '/tools/tavern': 'tabler:beer',
  '/tools/initiative': 'tabler:swords',
  '/gods': 'tabler:building-church',
  '/rules': 'tabler:book-2',
  '/books': 'tabler:books',
  '/info/discord_bot': 'tabler:brand-discord',
  '/info/exporting': 'tabler:file-export',
  '/info/bookmarks': 'tabler:bookmarks',
};

/** Токенатор переехал на новый сайт. */
export const TOKENATOR_URL = 'https://new.ttg.club/tokenator';

/** Здешний токенатор: теперь его старая версия. */
export const TOKENATOR_LEGACY_URL = '/tools/tokenator';

/** Подпись старой версии токенатора. */
export const TOKENATOR_LEGACY_SUFFIX = ' (старая версия)';

/** Раздел Virtual TTG: в меню бэкенда его нет, как и в старом SPA. */
export const VTTG_MENU_GROUP: MenuGroup = {
  label: 'Virtual TTG',
  links: [
    {
      label: 'Информация',
      url: 'https://new.ttg.club/vttg',
      icon: 'tabler:info-circle',
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
