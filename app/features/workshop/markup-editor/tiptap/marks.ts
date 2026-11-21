import type {
  JSONContent,
  MarkdownLexerConfiguration,
  MarkdownParseHelpers,
  MarkdownRendererHelpers,
  MarkdownToken,
  MarkdownTokenizer,
} from '@tiptap/core';

import { Mark, mergeAttributes } from '@tiptap/core';

import { findMarkerEnd } from '~news/markup';

import { BLOCK_MARKER_NODE, FORMAT_MARK_ATTR } from './constants';
import { classifyLinkMarker } from './link-markers';
import { isBlockMarker } from './render-chip';
import { isHeadingMarkerStart } from './ttg-heading';
import { isListMarkerStart } from './ttg-list';
import { isParagraphMarkerStart } from './ttg-paragraph';
import { isQuoteMarkerStart } from './ttg-quote';
import { isTableMarkerStart } from './ttg-table';

const OPEN_BRACE = '{';
const AT_SIGN = '@';
const CLOSE_BRACE = '}';

/**
 * Спецификация форматирующего маркера {@...}, который в редакторе представляется
 * НАТИВНОЙ маркой TipTap (редактируемой и вкладываемой), а сериализуется обратно
 * в тег {@...}. Только «оборачивающие текст» маркеры без атрибутов — у них есть
 * прямой аналог в виде марки. Интерактив/ссылки/атрибутные остаются атомарными.
 */
interface FormatSpec {
  /** Тип маркера из markup/config.ts (`bold`, `italic`, …). */
  type: string;
  /** Имя марки в схеме TipTap. */
  mark: string;
  /** Алиас для сериализации: `{@<alias> ...}`. */
  alias: string;
  /** Алиасы, распознаваемые при парсинге ({@i}/{@italic} → italic). */
  aliases: string[];
  /** Имя markdown-токена (совпадает с тем, что отдаёт токенайзер). */
  token: string;
  /** Tailwind-классы для отображения марки в редакторе. */
  className: string;
  /** Хоткей переключения марки в нотации TipTap (`Mod` = Ctrl/⌘). */
  shortcut: string;
  /**
   * HTML-теги, которыми это же оформление приходит из ЧУЖОГО буфера обмена
   * (сайт, чат, редактор документов). По ним вставка приводится к нашей марке —
   * см. `paste-html.ts`.
   */
  htmlTags: string[];
}

/**
 * Источник истины по форматирующим маркерам. Алиасы согласованы с
 * MARKER_CONFIGS в markup/config.ts (дублируются здесь намеренно, чтобы модуль
 * не тянул .vue-компоненты из config и оставался Node-тестируемым).
 */
export const FORMAT_SPECS: FormatSpec[] = [
  {
    type: 'bold',
    mark: 'ttgBold',
    alias: 'b',
    aliases: ['b', 'bold'],
    token: 'ttgMark_bold',
    className: 'font-bold',
    shortcut: 'Mod-b',
    htmlTags: ['strong', 'b'],
  },
  {
    type: 'italic',
    mark: 'ttgItalic',
    alias: 'i',
    aliases: ['i', 'italic'],
    token: 'ttgMark_italic',
    className: 'italic',
    shortcut: 'Mod-i',
    htmlTags: ['em', 'i'],
  },
  {
    type: 'underline',
    mark: 'ttgUnderline',
    alias: 'u',
    aliases: ['u', 'underline'],
    token: 'ttgMark_underline',
    className: 'underline underline-offset-2',
    shortcut: 'Mod-u',
    htmlTags: ['u', 'ins'],
  },
  {
    type: 'strikethrough',
    mark: 'ttgStrike',
    alias: 's',
    aliases: ['s', 'strikethrough'],
    token: 'ttgMark_strike',
    className: 'line-through',
    shortcut: 'Mod-Shift-s',
    htmlTags: ['s', 'del', 'strike'],
  },
  {
    type: 'superscript',
    mark: 'ttgSuperscript',
    alias: 'sup',
    aliases: ['sup', 'superscript'],
    token: 'ttgMark_superscript',
    className: 'align-super text-[0.75em]',
    shortcut: 'Mod-.',
    htmlTags: ['sup'],
  },
  {
    type: 'subscript',
    mark: 'ttgSubscript',
    alias: 'sub',
    aliases: ['sub', 'subscript'],
    token: 'ttgMark_subscript',
    className: 'align-sub text-[0.75em]',
    shortcut: 'Mod-,',
    htmlTags: ['sub'],
  },
  {
    type: 'highlight',
    mark: 'ttgHighlight',
    alias: 'mark',
    aliases: ['mark', 'highlight'],
    token: 'ttgMark_highlight',
    className: 'rounded bg-warning/30 px-0.5',
    shortcut: 'Mod-Shift-h',
    htmlTags: ['mark'],
  },
];

const ALIAS_TO_SPEC = new Map<string, FormatSpec>(
  FORMAT_SPECS.flatMap((spec) => spec.aliases.map((alias) => [alias, spec])),
);

/**
 * Проверяет, есть ли в строке разделитель атрибутов «|» на верхнем уровне
 * (вне вложенных {@...}). Маркеры с атрибутами остаются атомарными, чтобы не
 * потерять атрибуты при round-trip.
 */
function hasTopLevelPipe(source: string): boolean {
  let level = 0;

  for (let i = 0; i < source.length; i++) {
    if (source[i] === OPEN_BRACE && source[i + 1] === AT_SIGN) {
      level++;
      i++;

      continue;
    }

    if (source[i] === CLOSE_BRACE) {
      if (level > 0) {
        level--;
      }

      continue;
    }

    if (source[i] === '|' && level === 0) {
      return true;
    }
  }

  return false;
}

/**
 * Определяет, является ли сырой маркер {@...} форматирующим (→ марка) и извлекает
 * его внутреннее содержимое. Возвращает null для интерактивных/ссылочных/
 * атрибутных/пустых маркеров — они обрабатываются как атомарный узел.
 *
 * @param raw - Сырая строка маркера, например `{@i Вы **бросаете**}`
 */
function classifyFormatMarker(
  raw: string,
): { spec: FormatSpec; inner: string } | null {
  const body = raw.slice(2, -1);
  const firstSpace = body.indexOf(' ');
  const alias = firstSpace < 0 ? body : body.slice(0, firstSpace);
  const inner = firstSpace < 0 ? '' : body.slice(firstSpace + 1);

  const spec = ALIAS_TO_SPEC.get(alias);

  if (!spec || !inner.trim() || hasTopLevelPipe(inner)) {
    return null;
  }

  return { spec, inner };
}

/**
 * Единый токенайзер markdown для маркеров {@...}. Форматирующие маркеры отдаются
 * как токен своей марки с уже разобранным вложенным inline-содержимым (чтобы
 * Markdown и вложенные {@...} работали внутри), остальные — как атомарный
 * токен `ttgMarker` с сырой строкой.
 */
export const markerMarkdownTokenizer: MarkdownTokenizer = {
  name: 'ttgMarker',
  level: 'inline',
  start: (source: string) => source.indexOf('{@'),
  tokenize: (
    source: string,
    _tokens: MarkdownToken[],
    lexer: MarkdownLexerConfiguration,
  ): MarkdownToken | undefined => {
    if (!source.startsWith('{@')) {
      return undefined;
    }

    const end = findMarkerEnd(source);

    if (end < 0) {
      return undefined;
    }

    const raw = source.slice(0, end);
    const format = classifyFormatMarker(raw);

    if (format) {
      return {
        type: format.spec.token,
        raw,
        tokens: lexer.inlineTokens(format.inner),
      };
    }

    // Ссылка на раздел / внешняя ссылка ({@spell}/{@species}/…/{@link} с url:) —
    // редактируемый узел с текстовой подписью (курсор внутрь, правка по буквам),
    // а не атомарный чип. Всё прочее (badge/kbd/dice/…) остаётся атомом.
    if (classifyLinkMarker(raw)) {
      return { type: 'ttgSectionLink', raw };
    }

    return { type: 'ttgMarker', raw };
  },
};

/**
 * БЛОЧНЫЙ токенайзер markdown для маркеров {@...}, занимающих строку целиком
 * (заголовок/список/цитата/разделитель/таблица). Такой маркер разбирается в
 * блочный узел `ttgBlockMarker` — он стоит МЕЖДУ абзацами (а не внутри), поэтому
 * при сериализации выходит своим блоком, отделённым пустой строкой.
 *
 * Маркер с текстом на той же строке (`{@h ...}текст`) или НЕблочный маркер сюда
 * не попадают — их ловит инлайновый `markerMarkdownTokenizer` (чип/марка).
 */
export const blockMarkerMarkdownTokenizer: MarkdownTokenizer = {
  name: BLOCK_MARKER_NODE,
  level: 'block',
  // Блочный маркер начинается с начала строки — только туда и «прицеливаемся».
  start: (source: string) => {
    if (source.startsWith('{@')) {
      return 0;
    }

    const index = source.indexOf('\n{@');

    return index < 0 ? -1 : index + 1;
  },
  tokenize: (source: string): MarkdownToken | undefined => {
    if (!source.startsWith('{@')) {
      return undefined;
    }

    // Списки, таблицы, цитаты, заголовки и выровненные абзацы обрабатывают
    // НАТИВНЫЕ токенайзеры (редактируемые узлы) — сюда попадают только прочие
    // блочные маркеры (разделитель).
    if (
      isListMarkerStart(source)
      || isTableMarkerStart(source)
      || isQuoteMarkerStart(source)
      || isHeadingMarkerStart(source)
      || isParagraphMarkerStart(source)
    ) {
      return undefined;
    }

    const end = findMarkerEnd(source);

    if (end < 0) {
      return undefined;
    }

    // Только блочные маркеры (заголовок/список/цитата/разделитель/таблица).
    if (!isBlockMarker(source.slice(0, end))) {
      return undefined;
    }

    // После «}» на строке допустимы только пробелы: иначе это инлайн-случай.
    const trailing = source.slice(end).match(/^[ \t]*(\n+|$)/);

    if (!trailing) {
      return undefined;
    }

    return {
      type: BLOCK_MARKER_NODE,
      raw: source.slice(0, end + trailing[0].length),
    };
  },
};

/**
 * Варианты хоткея для регистрации в keymap: для буквенной клавиши добавляется
 * дубль с ЗАГЛАВНОЙ буквой (как у штатных Bold/Italic TipTap) — при включённом
 * CapsLock событие приходит с key в верхнем регистре, и без дубля хоткей молчит.
 */
function shortcutVariants(shortcut: string): string[] {
  const parts = shortcut.split('-');
  const key = parts.at(-1) ?? '';

  if (!/^[a-z]$/.test(key)) {
    return [shortcut];
  }

  return [shortcut, [...parts.slice(0, -1), key.toUpperCase()].join('-')];
}

/**
 * Создаёт марку TipTap для форматирующего маркера {@...}: редактируемое
 * содержимое, отображение стилем, round-trip `{@<alias> …}` через markdown-API
 * и хоткей переключения (стандартные комбинации TipTap; StarterKit-марки со
 * своими хоткеями в редакторе отключены — см. starterKit в MarkupEditor.vue).
 */
function createFormatMark(spec: FormatSpec) {
  return Mark.create({
    name: spec.mark,

    addKeyboardShortcuts() {
      const toggle = () => this.editor.commands.toggleMark(spec.mark);

      return Object.fromEntries(
        shortcutVariants(spec.shortcut).map((combo) => [combo, toggle]),
      );
    },

    markdownTokenName: spec.token,
    parseMarkdown: (token: MarkdownToken, helpers: MarkdownParseHelpers) =>
      helpers.applyMark(spec.mark, helpers.parseInline(token.tokens ?? [])),
    renderMarkdown: (node: JSONContent, helpers: MarkdownRendererHelpers) =>
      `{@${spec.alias} ${helpers.renderChildren(node)}}`,

    parseHTML() {
      return [{ tag: `span[${FORMAT_MARK_ATTR}="${spec.type}"]` }];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'span',
        mergeAttributes(
          { [FORMAT_MARK_ATTR]: spec.type, class: spec.className },
          HTMLAttributes,
        ),
        0,
      ];
    },
  });
}

/**
 * Набор форматирующих марок TipTap ({@b}/{@i}/{@u}/{@s}/{@sup}/{@sub}/{@mark}).
 * Подключается к UEditor через `:extensions`.
 */
export const ttgFormatMarks = FORMAT_SPECS.map((spec) =>
  createFormatMark(spec),
);
