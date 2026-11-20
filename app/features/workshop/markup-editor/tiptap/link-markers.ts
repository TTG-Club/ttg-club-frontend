/**
 * Классификация и разбор ИНЛАЙНОВЫХ ссылочных маркеров `{@... | url:...}` для
 * редактируемого узла TtgSectionLink: ссылки на разделы сайта ({@spell}/{@species}/
 * …) и обычная внешняя ссылка ({@link}). В отличие от атомарного чипа, у такого
 * узла подпись — РЕДАКТИРУЕМЫЙ текст, а `kind`/`url` живут в атрибутах и обратно
 * собираются в `{@<kind> подпись | url:<url>}`.
 *
 * Модуль ЧИСТЫЙ (без импорта .vue), чтобы токенайзер в `marks.ts` оставался
 * Node-тестируемым. Алиасы согласованы с MARKER_CONFIGS в markup/config.ts
 * (дублируются намеренно — как FORMAT_SPECS в marks.ts).
 */

const OPEN_BRACE = '{';
const AT_SIGN = '@';
const CLOSE_BRACE = '}';

/** Канонический тип ссылки → распознаваемые алиасы (для разбора сырого маркера). */
const LINK_KIND_ALIASES: Record<string, string[]> = {
  link: ['a', 'link'],
  class: ['class'],
  species: ['species', 'race'],
  spell: ['spell'],
  feat: ['feat'],
  background: ['background'],
  magicItem: ['magicItem', 'magic-item'],
  item: ['item'],
  creature: ['creature', 'bestiary'],
  glossary: ['glossary'],
};

/** Алиас маркера → канонический `kind` узла. */
const LINK_ALIAS_TO_KIND = new Map<string, string>(
  Object.entries(LINK_KIND_ALIASES).flatMap(([kind, aliases]) =>
    aliases.map((alias) => [alias, kind]),
  ),
);

/** Все канонические типы ссылок, которые редактор рисует редактируемым узлом. */
export const LINK_KINDS = new Set(Object.keys(LINK_KIND_ALIASES));

/** Ссылка на раздел сайта (с иконкой раздела), а не обычная внешняя `{@link}`. */
export function isSectionKind(kind: string): boolean {
  return kind !== 'link' && LINK_KINDS.has(kind);
}

/**
 * Заменяет структурные символы маркера в подписи, чтобы собранный `{@...}` не
 * сломался при разборе: `|` (разделитель атрибутов) → `/`, фигурные скобки —
 * убираются. Зеркалит `sanitizeMarkerText` из toolbar-items (дублируется, чтобы
 * не тянуть .vue-зависимости в чистый модуль).
 */
export function sanitizeLabel(text: string): string {
  return text.replace(/\|/g, '/').replace(/[{}]/g, '');
}

/** Разбирает тело маркера на подпись (до первого `|`) и параметры, игнорируя `|` внутри вложенных {@...}. */
function splitTopLevelPipe(rest: string): { label: string; params: string[] } {
  const segments: string[] = [];

  let acc = '';
  let level = 0;

  for (let i = 0; i < rest.length; i++) {
    const char = rest[i];

    if (char === OPEN_BRACE && rest[i + 1] === AT_SIGN) {
      level++;
      acc += `${OPEN_BRACE}${AT_SIGN}`;
      i++;

      continue;
    }

    if (char === CLOSE_BRACE) {
      if (level > 0) {
        level--;
      }

      acc += CLOSE_BRACE;

      continue;
    }

    if (char === '|' && level === 0) {
      segments.push(acc);
      acc = '';

      continue;
    }

    acc += char;
  }

  segments.push(acc);

  const [label = '', ...params] = segments;

  return { label: label.trim(), params: params.map((param) => param.trim()) };
}

/** Значение атрибута `url:<...>` (или `url=<...>`) из параметров, иначе пустая строка. */
function extractUrl(params: string[]): string {
  for (const param of params) {
    if (param.startsWith('url:') || param.startsWith('url=')) {
      return param.slice(4).trim();
    }
  }

  return '';
}

/** Результат классификации ссылочного маркера. */
export interface LinkMarker {
  kind: string;
  label: string;
  url: string;
}

/**
 * Классифицирует сырой маркер `{@...}` как редактируемую ссылку и извлекает
 * `kind`/подпись/`url`. Возвращает null, если это не ссылка (другой тип) или у
 * ссылки нет `url:` — такие маркеры остаются атомарным чипом (текущее поведение,
 * без потери данных).
 *
 * @param raw - Сырая строка маркера, например `{@spell Огненный шар | url:fireball-phb}`
 */
export function classifyLinkMarker(raw: string): LinkMarker | null {
  if (
    !raw.startsWith(`${OPEN_BRACE}${AT_SIGN}`)
    || !raw.endsWith(CLOSE_BRACE)
  ) {
    return null;
  }

  const body = raw.slice(2, -1);
  const firstSpace = body.indexOf(' ');

  if (firstSpace < 0) {
    return null;
  }

  const kind = LINK_ALIAS_TO_KIND.get(body.slice(0, firstSpace));

  if (!kind) {
    return null;
  }

  const { label, params } = splitTopLevelPipe(body.slice(firstSpace + 1));
  const url = extractUrl(params);

  // Ссылку без url оставляем атомарным чипом: на странице она и так роняет
  // рендер (throw), но конвертировать в редактируемый узел бессмысленно.
  if (!url) {
    return null;
  }

  return { kind, label, url };
}
