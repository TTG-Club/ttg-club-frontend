import type { VNode } from 'vue';
import type { MarkerNode } from '~news/markup';

import { h } from 'vue';

import { UIcon } from '#components';
import {
  getNodeText,
  isBlockNode,
  isMarkerNode,
  MARKER_ALIASES,
  MARKER_MAP,
  parse,
} from '~news/markup';
import { render } from '~news/markup/ui';

import { SECTION_TAGS } from '../tags';

/**
 * Иконка раздела по типу маркера — единый источник истины с тулбаром
 * (`SECTION_TAGS`), чтобы чип секционной ссылки и кнопка вставки совпадали.
 * Экспортируется и для редактируемого узла ссылки (SectionLinkChip).
 */
export const SECTION_ICONS = new Map(
  SECTION_TAGS.map((tag) => [tag.key, tag.icon]),
);

/**
 * Является ли маркер {@...} блочным (заголовок, список, цитата, разделитель,
 * таблица). Нужно, чтобы NodeView отрисовал такой чип блоком, а не инлайном.
 *
 * Лёгкая проверка ПО ИМЕНИ маркера через конфиг (алиас → тип → флаг isBlock), без
 * полного рекурсивного парса — вызывается в токенайзере на каждый блок-кандидат.
 *
 * @param raw - Сырая строка маркера
 */
export function isBlockMarker(raw: string): boolean {
  if (!raw.startsWith('{@')) {
    return false;
  }

  let cursor = 2;

  while (cursor < raw.length && raw[cursor] !== ' ' && raw[cursor] !== '}') {
    cursor++;
  }

  const type = MARKER_ALIASES.get(raw.slice(2, cursor));

  return type ? MARKER_MAP.get(type)?.isBlock === true : false;
}

/**
 * Рендерит содержимое маркера как VNode-детей (поддерживает вложенные {@...},
 * например {@b ...} внутри {@i ...}). При ошибке — плоский текст-подпись.
 *
 * @param marker - Разобранный узел маркера
 * @returns Массив VNode либо строка-подпись
 */
function renderChildren(marker: MarkerNode): VNode[] | string {
  const content = marker.content ?? [];
  const fallback = getNodeText(content) || marker.type;

  if (!content.length) {
    return fallback;
  }

  try {
    return render(content);
  } catch {
    return fallback;
  }
}

/**
 * Чип секционной ссылки в редакторе: иконка раздела + подпись, цвет primary.
 * Отличает {@spell}/{@creature}/… от обычной {@link} (нейтральный подчёркнутый
 * спан) — иначе в превью они выглядят одинаково и заклинание не отличить от ссылки.
 *
 * @param type - Тип секционного маркера (`spell`, `creature`, …)
 * @param children - Уже отрисованное содержимое чипа (подпись)
 */
function renderSectionChip(type: string, children: VNode[] | string): VNode {
  const icon = SECTION_ICONS.get(type);

  return h(
    'span',
    {
      class:
        'inline-flex items-center gap-0.5 align-middle text-primary underline decoration-primary/40 underline-offset-2',
    },
    [
      icon ? h(UIcon, { name: icon, class: 'size-3.5 shrink-0' }) : null,
      children,
    ],
  );
}

/**
 * Строит визуальный чип маркера {@...} из уже разобранного узла. Блочные маркеры
 * рисуем РЕАЛЬНЫМ компонентом (как на странице), остальные — упрощённым
 * предпросмотром по типу (форматирование — тегами, ссылки/интерактив — спанами).
 *
 * @param marker - Разобранный узел маркера
 * @param isBlock - Блочный ли маркер (вычислен в buildMarkerChip)
 * @returns VNode-представление чипа
 */
function renderChip(marker: MarkerNode, isBlock: boolean): VNode {
  const children = renderChildren(marker);

  if (isBlock) {
    try {
      const [vnode] = render([marker]);

      if (vnode) {
        return vnode;
      }
    } catch {
      // Падать нельзя — ниже отрисуем упрощённый вариант.
    }
  }

  switch (marker.type) {
    case 'bold':
      return h('strong', { class: 'font-semibold' }, children);
    case 'italic':
      return h('em', children);
    case 'underline':
      return h('u', children);
    case 'strikethrough':
      return h('s', children);
    case 'superscript':
      return h('sup', children);
    case 'subscript':
      return h('sub', children);
    case 'highlight':
      return h('mark', { class: 'rounded bg-warning/30 px-0.5' }, children);
    case 'kbd':
      return h(
        'kbd',
        {
          class:
            'rounded border border-default bg-elevated px-1 py-0.5 font-mono text-xs',
        },
        children,
      );
    case 'badge':
      return h(
        'span',
        {
          class:
            'rounded bg-primary/15 px-1.5 py-0.5 text-xs font-medium text-primary',
        },
        children,
      );
    case 'roll': {
      // Показываем текст (`text`), если задан — как на странице; иначе контент
      // (сама формула, напр. простой `{@dice 2к6}`).
      const text = marker.attrs?.text;
      const raw = text == null ? '' : String(text);
      const label = raw.trim() ? raw : children;

      return h(
        'span',
        {
          class: 'text-link underline decoration-dotted underline-offset-2',
        },
        label,
      );
    }
    case 'break':
      return h('br');
    // Обычная ссылка — нейтральный спан-ссылка.
    case 'link':
      return h(
        'span',
        { class: 'text-link underline underline-offset-2' },
        children,
      );
    // Ссылки на разделы сайта — та же ссылка, но с иконкой раздела и цветом
    // primary, чтобы {@spell}/{@creature}/… визуально не сливались с {@link}.
    case 'class':
    case 'species':
    case 'spell':
    case 'feat':
    case 'background':
    case 'magicItem':
    case 'creature':
    case 'item':
    case 'glossary':
      return renderSectionChip(marker.type, children);
    default:
      return h('span', children);
  }
}

/**
 * Разбирает сырую строку маркера {@...} ОДИН раз и отдаёт готовый чип и флаг
 * блочности — чтобы NodeView (MarkerChip) не парсил raw дважды.
 *
 * @param raw - Сырая строка маркера, например `{@i текст}`
 * @returns Чип-VNode и признак блочного маркера
 */
export function buildMarkerChip(raw: string): {
  chip: VNode;
  isBlock: boolean;
} {
  const marker = parse(raw).find((node): node is MarkerNode =>
    isMarkerNode(node),
  );

  if (!marker) {
    return { chip: h('span', raw), isBlock: false };
  }

  const isBlock = isBlockNode(marker);

  return { chip: renderChip(marker, isBlock), isBlock };
}
