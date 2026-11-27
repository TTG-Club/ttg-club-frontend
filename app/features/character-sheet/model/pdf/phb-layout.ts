import type { Color, PDFFont, PDFPage } from 'pdf-lib';

import type { PdfBuildContext, PdfRect, PdfSlot, PdfTextAlign } from './types';

import {
  PDF_CONTENT_WIDTH,
  PDF_ELLIPSIS,
  PDF_PAGE_HEIGHT,
  PDF_PAGE_MARGIN,
} from './constants';
import {
  drawRule,
  drawTextLine,
  getTextWidth,
  truncateText,
  wrapPlainText,
} from './layout';
import {
  PHB_COLORS,
  PHB_COLUMN_GAP,
  PHB_DIGIT_HEIGHT_RATIO,
  PHB_FONT_SIZES,
  PHB_HEADER,
  PHB_LABELS,
  PHB_LINE_HEIGHT,
  PHB_LINE_WIDTHS,
  PHB_MIN_CAPTION_SIZE,
  PHB_PADDING,
  PHB_RADIUS,
  PHB_TITLE_HEIGHT,
  PHB_TITLE_SPACING_RATIO,
} from './phb-constants';
import { drawPdfQrCode } from './qr';

/** Оформление рамки листа PHB. */
export interface PhbBoxOptions {
  fill?: Color;
  radius?: number;
  borderWidth?: number;
}

/** Поле «значение над линией, подпись под ней». */
export interface PhbFieldOptions extends PdfSlot {
  label: string;
  value: string;
  valueSize?: number;
}

/** Строки текста на линовке. */
export interface PhbLinedTextOptions {
  /** Абзацы или строки списка: каждая начинается с новой линии. */
  paragraphs: string[];

  /** Каждая запись — одна строка, не влезающее обрезается многоточием. */
  isList?: boolean;

  /** Колонок линовки. */
  columns?: number;
}

/**
 * Контур прямоугольника со скруглёнными углами в координатах SVG-пути
 * (отсчёт от левого верхнего угла, ось Y вниз).
 *
 * @param width ширина.
 * @param height высота.
 * @param radius радиус скругления.
 * @returns строка SVG-пути.
 */
function getRoundedPath(width: number, height: number, radius: number): string {
  const corner = Math.min(radius, width / 2, height / 2);

  return [
    `M ${corner} 0`,
    `L ${width - corner} 0`,
    `Q ${width} 0 ${width} ${corner}`,
    `L ${width} ${height - corner}`,
    `Q ${width} ${height} ${width - corner} ${height}`,
    `L ${corner} ${height}`,
    `Q 0 ${height} 0 ${height - corner}`,
    `L 0 ${corner}`,
    `Q 0 0 ${corner} 0`,
    'Z',
  ].join(' ');
}

/**
 * Рамка со скруглёнными углами — панель печатного листа.
 *
 * @param page страница.
 * @param options геометрия, заливка, скругление и толщина линии.
 */
export function drawPhbBox(
  page: PDFPage,
  options: PdfRect & PhbBoxOptions,
): void {
  const path = getRoundedPath(
    options.width,
    options.height,
    options.radius ?? PHB_RADIUS,
  );

  const position = {
    x: options.left,
    y: PDF_PAGE_HEIGHT - options.top,
    color: options.fill ?? PHB_COLORS.field,
  };

  // Нулевая толщина у pdf-lib всё равно рисует волосяную линию — серые
  // строки без рамки рисуются без обводки вовсе.
  page.drawSvgPath(
    path,
    options.borderWidth === 0
      ? position
      : {
          ...position,
          borderColor: PHB_COLORS.ink,
          borderWidth: options.borderWidth ?? PHB_LINE_WIDTHS.frame,
        },
  );
}

/**
 * Серая подложка группы панелей: колонка характеристик, рамки колонок.
 *
 * @param page страница.
 * @param rect геометрия подложки.
 */
export function drawPhbGroup(page: PDFPage, rect: PdfRect): void {
  drawPhbBox(page, {
    ...rect,
    fill: PHB_COLORS.group,
    borderWidth: PHB_LINE_WIDTHS.thin,
  });
}

/**
 * Шестиугольник со срезанными боковыми углами: монеты, номер круга, поля
 * шапки страницы заклинаний.
 *
 * @param page страница.
 * @param rect геометрия шестиугольника.
 * @param fill заливка.
 */
export function drawPhbHexagon(
  page: PDFPage,
  rect: PdfRect,
  fill: Color = PHB_COLORS.field,
): void {
  const cut = Math.min(rect.height / 2, rect.width / 4);

  page.drawSvgPath(
    [
      `M ${cut} 0`,
      `L ${rect.width - cut} 0`,
      `L ${rect.width} ${rect.height / 2}`,
      `L ${rect.width - cut} ${rect.height}`,
      `L ${cut} ${rect.height}`,
      `L 0 ${rect.height / 2}`,
      'Z',
    ].join(' '),
    {
      x: rect.left,
      y: PDF_PAGE_HEIGHT - rect.top,
      color: fill,
      borderColor: PHB_COLORS.ink,
      borderWidth: PHB_LINE_WIDTHS.frame,
    },
  );
}

/**
 * Щит класса доспеха: прямой верх, борта и сходящийся к острию низ.
 *
 * @param page страница.
 * @param rect геометрия щита.
 */
export function drawPhbShield(page: PDFPage, rect: PdfRect): void {
  const { width, height } = rect;

  page.drawSvgPath(
    [
      'M 0 0',
      `Q ${width / 2} ${height * 0.08} ${width} 0`,
      `L ${width} ${height * 0.55}`,
      `Q ${width} ${height * 0.82} ${width / 2} ${height}`,
      `Q 0 ${height * 0.82} 0 ${height * 0.55}`,
      'Z',
    ].join(' '),
    {
      x: rect.left,
      y: PDF_PAGE_HEIGHT - rect.top,
      color: PHB_COLORS.field,
      borderColor: PHB_COLORS.ink,
      borderWidth: PHB_LINE_WIDTHS.frame,
    },
  );
}

/**
 * Кружок с рамкой (бонус мастерства, пассивная мудрость).
 *
 * @param page страница.
 * @param centerLeft центр по горизонтали.
 * @param centerTop центр по вертикали от верха страницы.
 * @param radius радиус.
 */
export function drawPhbCircle(
  page: PDFPage,
  centerLeft: number,
  centerTop: number,
  radius: number,
): void {
  page.drawCircle({
    x: centerLeft,
    y: PDF_PAGE_HEIGHT - centerTop,
    size: radius,
    color: PHB_COLORS.field,
    borderColor: PHB_COLORS.ink,
    borderWidth: PHB_LINE_WIDTHS.frame,
  });
}

/**
 * Овал со значением характеристики под её модификатором.
 *
 * @param page страница.
 * @param centerLeft центр по горизонтали.
 * @param centerTop центр по вертикали от верха страницы.
 * @param radiusX горизонтальная полуось.
 * @param radiusY вертикальная полуось.
 */
export function drawPhbOval(
  page: PDFPage,
  centerLeft: number,
  centerTop: number,
  radiusX: number,
  radiusY: number,
): void {
  page.drawEllipse({
    x: centerLeft,
    y: PDF_PAGE_HEIGHT - centerTop,
    xScale: radiusX,
    yScale: radiusY,
    color: PHB_COLORS.field,
    borderColor: PHB_COLORS.ink,
    borderWidth: PHB_LINE_WIDTHS.frame,
  });
}

/**
 * Верх строки, при котором цифры встают по центру заданной линии.
 * `drawTextLine` отсчитывает строку от верхнего выносного элемента, а у цифр
 * его нет — без поправки число в круге или поле съезжает вниз.
 *
 * @param font шрифт числа.
 * @param size кегль числа.
 * @param centerTop вертикальный центр места под число.
 * @returns координата верха строки для `drawTextLine`.
 */
export function getPhbCenteredTop(
  font: PDFFont,
  size: number,
  centerTop: number,
): number {
  const ascent = font.heightAtSize(size, { descender: false });

  return centerTop + (size * PHB_DIGIT_HEIGHT_RATIO) / 2 - ascent;
}

/**
 * Значение по центру места: число в круге, поле или рамке.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param options текст, кегль, центр по вертикали и ширина места.
 * @param options.text значение.
 * @param options.size кегль.
 * @param options.centerTop вертикальный центр места.
 */
export function drawPhbCenteredValue(
  context: PdfBuildContext,
  page: PDFPage,
  options: Omit<PdfSlot, 'top'> & {
    text: string;
    size: number;
    centerTop: number;
  },
): void {
  drawTextLine(page, {
    text: options.text,
    left: options.left,
    top: getPhbCenteredTop(context.fonts.bold, options.size, options.centerTop),
    font: context.fonts.bold,
    size: options.size,
    color: PHB_COLORS.ink,
    maxWidth: options.width,
    align: 'center',
  });
}

/**
 * Подпись мелкими прописными с разрядкой — так на листе подписаны панели и
 * поля.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param options геометрия, текст, кегль и выравнивание.
 * @param options.text подпись.
 * @param options.size кегль; по умолчанию — заголовок панели.
 * @param options.align выравнивание; по умолчанию — по центру.
 */
export function drawPhbCaption(
  context: PdfBuildContext,
  page: PDFPage,
  options: PdfSlot & { text: string; size?: number; align?: PdfTextAlign },
): void {
  const text = options.text.toUpperCase();
  const baseSize = options.size ?? PHB_FONT_SIZES.title;

  const fullWidth = getTextWidth(
    text,
    context.fonts.bold,
    baseSize,
    baseSize * PHB_TITLE_SPACING_RATIO,
  );

  // Длинная подпись в узкой рамке («Спасброски от смерти») уменьшается, а не
  // обрезается: обрезанная подпись теряет смысл.
  const size =
    fullWidth > options.width
      ? Math.max(PHB_MIN_CAPTION_SIZE, (baseSize * options.width) / fullWidth)
      : baseSize;

  drawTextLine(page, {
    text,
    left: options.left,
    top: options.top,
    font: context.fonts.bold,
    size,
    color: PHB_COLORS.label,
    maxWidth: options.width,
    align: options.align ?? 'center',
    letterSpacing: size * PHB_TITLE_SPACING_RATIO,
  });
}

/**
 * Панель печатного листа: рамка и заголовок внизу, как в оригинале.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param rect геометрия панели.
 * @param title заголовок внизу панели.
 * @returns область содержимого над заголовком.
 */
export function drawPhbPanel(
  context: PdfBuildContext,
  page: PDFPage,
  rect: PdfRect,
  title: string,
): PdfRect {
  drawPhbBox(page, rect);

  drawPhbCaption(context, page, {
    text: title,
    left: rect.left + PHB_PADDING,
    top: rect.top + rect.height - PHB_TITLE_HEIGHT + 1.5,
    width: rect.width - PHB_PADDING * 2,
  });

  return {
    left: rect.left + PHB_PADDING,
    top: rect.top + PHB_PADDING,
    width: rect.width - PHB_PADDING * 2,
    height: rect.height - PHB_PADDING - PHB_TITLE_HEIGHT,
  };
}

/**
 * Поле шапки: значение над линией, подпись под ней.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param options геометрия, подпись и значение.
 */
export function drawPhbField(
  context: PdfBuildContext,
  page: PDFPage,
  options: PhbFieldOptions,
): void {
  const valueSize = options.valueSize ?? PHB_FONT_SIZES.field;

  drawTextLine(page, {
    text: options.value,
    left: options.left + 1,
    top: options.top,
    font: context.fonts.bold,
    size: valueSize,
    color: PHB_COLORS.ink,
    maxWidth: options.width - 2,
  });

  const lineTop = options.top + valueSize + 3;

  drawRule(page, {
    left: options.left,
    top: lineTop,
    width: options.width,
    color: PHB_COLORS.line,
    thickness: PHB_LINE_WIDTHS.thin,
  });

  drawPhbCaption(context, page, {
    text: options.label,
    left: options.left,
    top: lineTop + 2,
    width: options.width,
    size: PHB_FONT_SIZES.label,
    align: 'left',
  });
}

/**
 * Строки текста по ширине: абзацы переносятся по словам, записи списка
 * обрезаются в одну строку.
 *
 * @param context документ в процессе сборки.
 * @param options абзацы и режим списка.
 * @param width ширина строки.
 * @returns строки для линовки.
 */
function getPhbLines(
  context: PdfBuildContext,
  options: PhbLinedTextOptions,
  width: number,
): string[] {
  const font = context.fonts.regular;
  const size = PHB_FONT_SIZES.line;

  return options.paragraphs.flatMap((paragraph) =>
    options.isList
      ? [truncateText(paragraph, font, size, width)]
      : wrapPlainText(paragraph, font, size, width),
  );
}

/**
 * Линовка под запись с текстом на линиях. Не влезшее обрезается: в последней
 * строке ставится многоточие (у списка — хвост «… и ещё N»).
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param area область линовки.
 * @param options текст и число колонок.
 * @returns число записей списка, не влезших в линовку.
 */
export function drawPhbLinedText(
  context: PdfBuildContext,
  page: PDFPage,
  area: PdfRect,
  options: PhbLinedTextOptions,
): number {
  const columns = options.columns ?? 1;
  const columnGap = PHB_PADDING * 2;
  const columnWidth = (area.width - columnGap * (columns - 1)) / columns;
  const rowsPerColumn = Math.max(0, Math.floor(area.height / PHB_LINE_HEIGHT));
  const capacity = rowsPerColumn * columns;
  const font = context.fonts.regular;
  const size = PHB_FONT_SIZES.line;

  const lines = getPhbLines(context, options, columnWidth);

  // null — строка-хвост списка: на её месте рисуется «… и ещё N».
  let visible: Array<string | null> = lines.slice(0, capacity);
  let hidden = 0;

  if (lines.length > capacity && capacity > 0) {
    if (options.isList) {
      hidden = options.paragraphs.length - (capacity - 1);
      visible = [...lines.slice(0, capacity - 1), null];
    } else {
      visible[capacity - 1] = truncateText(
        `${visible[capacity - 1] ?? ''}${PDF_ELLIPSIS}`,
        font,
        size,
        columnWidth,
      );
    }
  }

  for (let index = 0; index < capacity; index += 1) {
    const column = Math.floor(index / rowsPerColumn);
    const row = index % rowsPerColumn;
    const left = area.left + (columnWidth + columnGap) * column;
    const lineTop = area.top + PHB_LINE_HEIGHT * (row + 1);

    drawRule(page, {
      left,
      top: lineTop,
      width: columnWidth,
      color: PHB_COLORS.line,
      thickness: PHB_LINE_WIDTHS.ruling,
    });

    const text = visible[index];

    if (text === undefined || text === '') {
      continue;
    }

    const isMore = text === null;

    drawTextLine(page, {
      text: text ?? PHB_LABELS.more(hidden),
      left: left + 1,
      top: lineTop - size - 1,
      font: isMore ? context.fonts.italic : font,
      size,
      color: isMore ? PHB_COLORS.label : PHB_COLORS.ink,
      maxWidth: columnWidth - 2,
    });
  }

  return hidden;
}

/**
 * Лента шапки слева: одно крупное поле (имя персонажа, класс заклинателя) и,
 * если задан, QR-код со ссылкой на лист у правого края.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param field подпись, значение и текст QR-кода.
 * @param field.label подпись под линией.
 * @param field.value значение.
 * @param field.qrText ссылка для QR-кода; null — без кода.
 */
export function drawPhbBanner(
  context: PdfBuildContext,
  page: PDFPage,
  field: { label: string; value: string; qrText?: string | null },
): void {
  const rect = {
    left: PDF_PAGE_MARGIN,
    top: PHB_HEADER.top,
    width: PHB_HEADER.bannerWidth,
    height: PHB_HEADER.height,
  };

  drawPhbGroup(page, rect);

  const qrSize = rect.height - PHB_PADDING * 2;
  const qrSpace = field.qrText ? qrSize + PHB_PADDING : 0;

  if (field.qrText) {
    drawPdfQrCode(page, {
      text: field.qrText,
      left: rect.left + rect.width - PHB_PADDING - qrSize,
      top: rect.top + PHB_PADDING,
      width: qrSize,
    });
  }

  const valueSize = PHB_FONT_SIZES.medium + 2;

  drawPhbField(context, page, {
    left: rect.left + PHB_PADDING * 2,
    top: rect.top + (rect.height - valueSize - PHB_FONT_SIZES.label - 5) / 2,
    width: rect.width - PHB_PADDING * 4 - qrSpace,
    label: field.label,
    value: field.value,
    valueSize,
  });
}

/**
 * Рамка шапки справа от ленты.
 *
 * @returns геометрия рамки.
 */
export function getPhbHeaderBoxRect(): PdfRect {
  const left = PDF_PAGE_MARGIN + PHB_HEADER.bannerWidth + PHB_COLUMN_GAP;

  return {
    left,
    top: PHB_HEADER.top,
    width: PDF_PAGE_MARGIN + PDF_CONTENT_WIDTH - left,
    height: PHB_HEADER.height,
  };
}

/**
 * Рамка шапки с полями в два ряда по три (класс, предыстория, раса… или
 * приметы внешности).
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param fields шесть полей слева направо, сверху вниз.
 */
export function drawPhbHeaderFields(
  context: PdfBuildContext,
  page: PDFPage,
  fields: Array<{ label: string; value: string }>,
): void {
  const rect = getPhbHeaderBoxRect();
  const perRow = 3;
  const gap = PHB_PADDING * 2;
  const innerWidth = rect.width - PHB_PADDING * 4;
  const fieldWidth = (innerWidth - gap * (perRow - 1)) / perRow;
  const rowHeight = (rect.height - PHB_PADDING * 2) / 2;

  drawPhbBox(page, rect);

  for (const [index, field] of fields.entries()) {
    const column = index % perRow;
    const row = Math.floor(index / perRow);

    drawPhbField(context, page, {
      left: rect.left + PHB_PADDING * 2 + (fieldWidth + gap) * column,
      top: rect.top + PHB_PADDING + 3 + rowHeight * row,
      width: fieldWidth,
      label: field.label,
      value: field.value,
    });
  }
}
