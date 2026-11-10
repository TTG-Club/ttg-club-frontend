interface MarkerConfig {
  type: string;
  tag?: string;
  /** Рисуется Vue-компонентом (см. `MARKER_COMPONENTS` в renderer.ts) */
  component?: boolean;
  aliases?: string[];
  isEmpty?: boolean;
  isBlock?: boolean;
}

export const MARKER_CONFIGS: MarkerConfig[] = [
  // HTML-теги (inline)
  { type: 'bold', tag: 'b', aliases: ['b'] },
  { type: 'italic', tag: 'i', aliases: ['i'] },
  { type: 'underline', tag: 'u', aliases: ['u'] },
  { type: 'strikethrough', tag: 's', aliases: ['s'] },
  { type: 'superscript', tag: 'sup', aliases: ['sup'] },
  { type: 'subscript', tag: 'sub', aliases: ['sub'] },
  { type: 'highlight', tag: 'mark', aliases: ['mark'] },
  { type: 'break', tag: 'br', aliases: ['br'], isEmpty: true },

  // Vue-компоненты (inline)
  { type: 'link', component: true, aliases: ['a', 'link'] },
  { type: 'kbd', component: true, aliases: ['kbd'] },
  { type: 'badge', component: true, aliases: ['badge'] },
  { type: 'roll', component: true, aliases: ['dice'] },

  // Блочные элементы
  { type: 'heading', component: true, aliases: ['h'], isBlock: true },
  // Абзац с оформлением (например выравниванием). Обычный текст остаётся
  // простой строкой; `{@p ...}` появляется ТОЛЬКО когда у абзаца есть
  // атрибут (align).
  {
    type: 'paragraph',
    component: true,
    aliases: ['p'],
    isBlock: true,
  },
  {
    type: 'quote',
    component: true,
    aliases: ['blockquote', 'quote', 'q'],
    isBlock: true,
  },
  { type: 'separator', component: true, isBlock: true },
  { type: 'list', component: true, isBlock: true },
  {
    type: 'li',
    component: true,
    aliases: ['listItem'],
    isBlock: true,
  },
  { type: 'table', component: true, isBlock: true },

  // Sections
  { type: 'class', component: true },
  { type: 'species', component: true, aliases: ['race'] },
  { type: 'spell', component: true },
  { type: 'feat', component: true },
  { type: 'background', component: true },
  { type: 'magicItem', component: true, aliases: ['magic-item'] },
  { type: 'creature', component: true, aliases: ['bestiary'] },
  { type: 'item', component: true },
  { type: 'glossary', component: true },
];

// Генерация типа из значений конфига
export type MarkerType = (typeof MARKER_CONFIGS)[number]['type'];

export const MARKER_MAP = new Map(
  MARKER_CONFIGS.map((config) => [config.type, config]),
);

export const MARKER_ALIASES = new Map(
  MARKER_CONFIGS.flatMap((config) =>
    [config.type, ...(config.aliases || [])].map((alias) => [
      alias,
      config.type,
    ]),
  ),
);

/**
 * Тот же словарь, но с ключами в нижнем регистре — для поиска,
 * нечувствительного к регистру.
 *
 * В данных встречаются опечатки вроде `{@I ...}` вместо `{@i ...}`; без
 * этого маркер считается неизвестным и теряется вместе со своим текстом.
 * Разные `type` в нижнем регистре не сталкиваются (`magicItem` →
 * `magicitem`, псевдоним `magic-item` остаётся отдельным ключом).
 */
export const MARKER_ALIASES_LOWERCASE = new Map(
  [...MARKER_ALIASES].map(([alias, type]) => [alias.toLowerCase(), type]),
);
