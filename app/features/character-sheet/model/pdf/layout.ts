import type { PDFFont, PDFPage } from 'pdf-lib';

import type {
  PdfBlockKind,
  PdfBoxOptions,
  PdfBuildContext,
  PdfFlow,
  PdfFlowOptions,
  PdfFonts,
  PdfMarkOptions,
  PdfPanelOptions,
  PdfPanelTitleOptions,
  PdfRuleOptions,
  PdfTableColumn,
  PdfTableRowOptions,
  PdfTextAlign,
  PdfTextBlock,
  PdfTextOptions,
  PdfTextRun,
  PdfTextStyle,
  PdfValueBoxOptions,
  PdfVerticalRuleOptions,
} from './types';

import {
  PDF_COLORS,
  PDF_CONTENT_BOTTOM,
  PDF_CONTINUED_SUFFIX,
  PDF_DENSE_ROW_HEIGHT,
  PDF_ELLIPSIS,
  PDF_FONT_SIZES,
  PDF_FOOTER_PAGE_LABEL,
  PDF_FOOTER_SITE,
  PDF_GAP,
  PDF_LINE_HEIGHT_RATIO,
  PDF_LINE_WIDTH,
  PDF_LIST_BULLET,
  PDF_LIST_INDENT,
  PDF_MARK_RADIUS,
  PDF_NOTE_SEPARATOR,
  PDF_PAGE_HEIGHT,
  PDF_PAGE_MARGIN,
  PDF_PAGE_WIDTH,
  PDF_PANEL_PADDING,
  PDF_PANEL_TITLE_HEIGHT,
  PDF_QUOTE_INDENT,
  PDF_ROW_HEIGHT,
  PDF_THIN_LINE_WIDTH,
  PDF_TITLE_LETTER_SPACING_RATIO,
} from './constants';

/**
 * Новая страница документа. Страницы копятся в контексте, чтобы в конце сборки
 * проставить в колонтитулах номера и общее количество.
 *
 * @param context документ в процессе сборки.
 * @returns добавленная страница.
 */
export function createPdfPage(context: PdfBuildContext): PDFPage {
  const page = context.document.addPage([PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT]);

  context.pages.push(page);

  return page;
}

/**
 * Базовая линия текста по координате верха строки. В PDF отсчёт идёт снизу
 * вверх, а весь модуль считает сверху вниз, поэтому пересчёт нужен на каждой
 * отрисовке текста.
 *
 * @param top координата верха строки от верха страницы.
 * @param font шрифт строки.
 * @param size размер шрифта.
 * @returns координата базовой линии в системе PDF.
 */
function getBaseline(top: number, font: PDFFont, size: number): number {
  return PDF_PAGE_HEIGHT - top - font.heightAtSize(size, { descender: false });
}

/**
 * Ширина текста с учётом разрядки.
 *
 * @param text текст.
 * @param font шрифт.
 * @param size размер шрифта.
 * @param letterSpacing разрядка между символами.
 * @returns ширина в пунктах.
 */
export function getTextWidth(
  text: string,
  font: PDFFont,
  size: number,
  letterSpacing = 0,
): number {
  const base = font.widthOfTextAtSize(text, size);

  if (!letterSpacing || text.length < 2) {
    return base;
  }

  return base + letterSpacing * (text.length - 1);
}

/**
 * Обрезка текста до заданной ширины с многоточием.
 *
 * @param text исходный текст.
 * @param font шрифт.
 * @param size размер шрифта.
 * @param maxWidth доступная ширина.
 * @returns текст, влезающий в ширину.
 */
export function truncateText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string {
  if (getTextWidth(text, font, size) <= maxWidth) {
    return text;
  }

  let truncated = text;

  while (
    truncated.length > 1
    && getTextWidth(`${truncated}${PDF_ELLIPSIS}`, font, size) > maxWidth
  ) {
    truncated = truncated.slice(0, -1);
  }

  return `${truncated.trimEnd()}${PDF_ELLIPSIS}`;
}

/**
 * Смещение строки внутри доступной ширины по выравниванию.
 *
 * @param textWidth ширина текста.
 * @param maxWidth доступная ширина.
 * @param align выравнивание.
 * @returns смещение слева.
 */
function getAlignOffset(
  textWidth: number,
  maxWidth: number,
  align: PdfTextAlign,
): number {
  if (align === 'center') {
    return Math.max(0, (maxWidth - textWidth) / 2);
  }

  if (align === 'right') {
    return Math.max(0, maxWidth - textWidth);
  }

  return 0;
}

/**
 * Отрисовка строки текста в координатах «сверху вниз». Разрядка рисуется
 * посимвольно: межсимвольного интервала у `drawText` в pdf-lib нет.
 *
 * @param page страница.
 * @param options параметры строки.
 */
export function drawTextLine(page: PDFPage, options: PdfTextOptions): void {
  const {
    font,
    size,
    color = PDF_COLORS.ink,
    letterSpacing = 0,
    maxWidth,
    align = 'left',
  } = options;

  const text =
    maxWidth === undefined
      ? options.text
      : truncateText(options.text, font, size, maxWidth);

  if (!text) {
    return;
  }

  const width = getTextWidth(text, font, size, letterSpacing);

  const left =
    maxWidth === undefined
      ? options.left
      : options.left + getAlignOffset(width, maxWidth, align);

  const baseline = getBaseline(options.top, font, size);

  if (!letterSpacing) {
    page.drawText(text, { x: left, y: baseline, size, font, color });

    return;
  }

  let cursor = left;

  for (const character of text) {
    page.drawText(character, { x: cursor, y: baseline, size, font, color });

    cursor += font.widthOfTextAtSize(character, size) + letterSpacing;
  }
}

/**
 * Перенос простого текста по словам.
 *
 * @param text текст.
 * @param font шрифт.
 * @param size размер шрифта.
 * @param maxWidth доступная ширина.
 * @returns строки текста (минимум одна, возможно пустая).
 */
export function wrapPlainText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const lines: string[] = [];

  for (const sourceLine of text.split('\n')) {
    let current = '';

    for (const word of sourceLine.split(/\s+/).filter(Boolean)) {
      const candidate = current ? `${current} ${word}` : word;

      // Слово, не влезающее в ширину даже одно, всё равно ставится в строку:
      // обрежет его уже отрисовка по `maxWidth`.
      if (!current || getTextWidth(candidate, font, size) <= maxWidth) {
        current = candidate;

        continue;
      }

      lines.push(current);
      current = word;
    }

    lines.push(current);
  }

  return lines.length ? lines : [''];
}

/**
 * Шрифт по начертанию фрагмента описания.
 *
 * @param fonts встроенные начертания.
 * @param style начертание фрагмента.
 * @returns шрифт для отрисовки.
 */
function getRunFont(fonts: PdfFonts, style: PdfTextStyle): PDFFont {
  if (style === 'bold') {
    return fonts.bold;
  }

  if (style === 'italic') {
    return fonts.italic;
  }

  return fonts.regular;
}

/**
 * Перенос текста с разными начертаниями: фрагменты режутся по словам, каждая
 * строка остаётся набором фрагментов со своими шрифтами.
 *
 * @param runs фрагменты текста.
 * @param fonts встроенные начертания.
 * @param size размер шрифта.
 * @param maxWidth доступная ширина.
 * @returns строки как наборы фрагментов.
 */
export function wrapTextRuns(
  runs: PdfTextRun[],
  fonts: PdfFonts,
  size: number,
  maxWidth: number,
): PdfTextRun[][] {
  const lines: PdfTextRun[][] = [];

  let currentLine: PdfTextRun[] = [];
  let currentWidth = 0;

  /** Закрывает набранную строку и начинает новую. */
  function pushLine(): void {
    if (currentLine.length) {
      lines.push(currentLine);
    }

    currentLine = [];
    currentWidth = 0;
  }

  for (const run of runs) {
    const font = getRunFont(fonts, run.style);

    for (const [segmentIndex, segment] of run.text.split('\n').entries()) {
      if (segmentIndex > 0) {
        pushLine();
      }

      // Пробелы остаются отдельными частями: иначе на стыке фрагментов
      // («жирный» + « и обычный») слова склеиваются.
      for (const word of segment.split(/(\s+)/).filter(Boolean)) {
        const wordWidth = getTextWidth(word, font, size);

        if (currentWidth + wordWidth > maxWidth && currentWidth > 0) {
          pushLine();

          // Пробел, попавший на перенос, в начало новой строки не переносится.
          if (!word.trim()) {
            continue;
          }
        }

        const lastRun = currentLine.at(-1);

        if (lastRun && lastRun.style === run.style) {
          lastRun.text += word;
        } else {
          currentLine.push({ text: word, style: run.style });
        }

        currentWidth += wordWidth;
      }
    }
  }

  pushLine();

  return lines;
}

/**
 * Отрисовка строки из фрагментов с разными начертаниями.
 *
 * @param fonts встроенные начертания.
 * @param page страница.
 * @param line фрагменты строки.
 * @param left левая граница.
 * @param top координата верха строки.
 * @param size размер шрифта.
 */
function drawRunLine(
  fonts: PdfFonts,
  page: PDFPage,
  line: PdfTextRun[],
  left: number,
  top: number,
  size: number,
): void {
  let cursor = left;

  for (const run of line) {
    const font = getRunFont(fonts, run.style);

    drawTextLine(page, { text: run.text, left: cursor, top, font, size });

    cursor += getTextWidth(run.text, font, size);
  }
}

/**
 * Горизонтальный разделитель.
 *
 * @param page страница.
 * @param options геометрия, цвет и толщина линии.
 */
export function drawRule(page: PDFPage, options: PdfRuleOptions): void {
  const y = PDF_PAGE_HEIGHT - options.top;

  page.drawLine({
    start: { x: options.left, y },
    end: { x: options.left + options.width, y },
    thickness: options.thickness ?? PDF_THIN_LINE_WIDTH,
    color: options.color ?? PDF_COLORS.innerLine,
  });
}

/**
 * Вертикальная линия (полоса цитаты, разделитель столбцов).
 *
 * @param page страница.
 * @param options геометрия и цвет линии.
 */
export function drawVerticalRule(
  page: PDFPage,
  options: PdfVerticalRuleOptions,
): void {
  page.drawLine({
    start: { x: options.left, y: PDF_PAGE_HEIGHT - options.top },
    end: { x: options.left, y: PDF_PAGE_HEIGHT - options.top - options.height },
    thickness: PDF_LINE_WIDTH,
    color: options.color ?? PDF_COLORS.innerLine,
  });
}

/**
 * Прямоугольник в координатах «сверху вниз».
 *
 * @param page страница.
 * @param options геометрия, заливка и рамка.
 */
export function drawBox(page: PDFPage, options: PdfBoxOptions): void {
  page.drawRectangle({
    x: options.left,
    y: PDF_PAGE_HEIGHT - options.top - options.height,
    width: options.width,
    height: options.height,
    color: options.fill,
    borderColor: options.border,
    borderWidth: options.border ? (options.borderWidth ?? PDF_LINE_WIDTH) : 0,
  });
}

/**
 * Заголовок панели: полоса с заливкой и разряжённой прописной подписью.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param options геометрия и текст заголовка.
 */
function drawPanelTitle(
  context: PdfBuildContext,
  page: PDFPage,
  options: PdfPanelTitleOptions,
): void {
  drawBox(page, {
    left: options.left,
    top: options.top,
    width: options.width,
    height: PDF_PANEL_TITLE_HEIGHT,
    fill: PDF_COLORS.titleFill,
  });

  const size = PDF_FONT_SIZES.panelTitle;

  drawTextLine(page, {
    text: options.title.toUpperCase(),
    left: options.left + PDF_PANEL_PADDING,
    top: options.top + (PDF_PANEL_TITLE_HEIGHT - size) / 2 - 0.5,
    font: context.fonts.display,
    size,
    letterSpacing: size * PDF_TITLE_LETTER_SPACING_RATIO,
    maxWidth: options.width - PDF_PANEL_PADDING * 2,
  });
}

/**
 * Панель с рамкой и заголовком. Содержимое рисует переданная функция и
 * возвращает занятую высоту — рамка обводится уже по факту, поэтому мерить
 * содержимое заранее не нужно.
 *
 * Панель не переносится на другую страницу: первая страница листа — фиксированная
 * раскладка, а длинные списки живут в потоке (`createPdfFlow`).
 *
 * @param context документ в процессе сборки.
 * @param options геометрия и заголовок панели.
 * @param drawContent отрисовка содержимого; возвращает занятую высоту.
 * @returns полная высота панели вместе с рамкой.
 */
export function drawPanel(
  context: PdfBuildContext,
  options: PdfPanelOptions,
  drawContent: (contentTop: number, contentWidth: number) => number,
): number {
  const { page } = options;

  drawPanelTitle(context, page, options);

  const contentTop = options.top + PDF_PANEL_TITLE_HEIGHT + PDF_PANEL_PADDING;
  const contentWidth = options.width - PDF_PANEL_PADDING * 2;

  const contentHeight = drawContent(contentTop, contentWidth);

  const height = Math.max(
    options.minHeight ?? 0,
    PDF_PANEL_TITLE_HEIGHT + PDF_PANEL_PADDING * 2 + contentHeight,
  );

  drawBox(page, {
    left: options.left,
    top: options.top,
    width: options.width,
    height,
    border: PDF_COLORS.panelLine,
  });

  return height;
}

/**
 * Бокс со значением: подпись сверху, крупное значение по центру и необязательная
 * приписка снизу (например, модификатор характеристики).
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param options геометрия, подпись, значение и приписка.
 */
export function drawValueBox(
  context: PdfBuildContext,
  page: PDFPage,
  options: PdfValueBoxOptions,
): void {
  drawBox(page, {
    left: options.left,
    top: options.top,
    width: options.width,
    height: options.height,
    fill: PDF_COLORS.boxFill,
    border: PDF_COLORS.panelLine,
  });

  drawTextLine(page, {
    text: options.label.toUpperCase(),
    left: options.left + 2,
    top: options.top + 3,
    font: context.fonts.bold,
    size: PDF_FONT_SIZES.label,
    color: PDF_COLORS.muted,
    maxWidth: options.width - 4,
    align: 'center',
  });

  const valueSize = options.valueSize ?? PDF_FONT_SIZES.bigValue;

  drawTextLine(page, {
    text: options.value,
    left: options.left,
    top: options.top + (options.height - valueSize) / 2,
    font: context.fonts.bold,
    size: valueSize,
    maxWidth: options.width,
    align: 'center',
  });

  if (!options.note) {
    return;
  }

  const noteSize = options.noteSize ?? PDF_FONT_SIZES.label;

  drawTextLine(page, {
    text: options.note,
    left: options.left,
    top: options.top + options.height - noteSize - 3,
    font: options.noteBold ? context.fonts.bold : context.fonts.regular,
    size: noteSize,
    color: PDF_COLORS.muted,
    maxWidth: options.width,
    align: 'center',
  });
}

/**
 * Кружок отметки: пустой, с точкой (владение вполовину), закрашенный (владение)
 * или закрашенный с внешним кольцом (компетентность).
 *
 * @param page страница.
 * @param options центр кружка и вид отметки.
 */
export function drawMark(page: PDFPage, options: PdfMarkOptions): void {
  const y = PDF_PAGE_HEIGHT - options.centerTop;

  if (options.ring) {
    page.drawCircle({
      x: options.centerLeft,
      y,
      size: PDF_MARK_RADIUS + 1.4,
      borderColor: PDF_COLORS.ink,
      borderWidth: PDF_THIN_LINE_WIDTH,
    });
  }

  page.drawCircle({
    x: options.centerLeft,
    y,
    size: PDF_MARK_RADIUS,
    color: options.fill === 'full' ? PDF_COLORS.ink : PDF_COLORS.blank,
    borderColor: PDF_COLORS.ink,
    borderWidth: PDF_LINE_WIDTH,
  });

  if (options.fill !== 'half') {
    return;
  }

  // Владение вполовину — точка внутри кружка: сектор в pdf-lib рисовать нечем,
  // а прямоугольная «половина» вылезала бы углами за окружность.
  page.drawCircle({
    x: options.centerLeft,
    y,
    size: PDF_MARK_RADIUS / 2,
    color: PDF_COLORS.ink,
  });
}

/**
 * Поток содержимого: держит текущую страницу и координату, при нехватке места
 * начинает новую страницу.
 *
 * @param context документ в процессе сборки.
 * @param options стартовая страница, границы и координата.
 * @returns поток содержимого.
 */
export function createPdfFlow(
  context: PdfBuildContext,
  options: PdfFlowOptions,
): PdfFlow {
  const state = {
    page: options.page ?? createPdfPage(context),
    top: options.top,
  };

  return {
    get page(): PDFPage {
      return state.page;
    },

    left: options.left,
    width: options.width,

    get top(): number {
      return state.top;
    },

    ensure(height: number): boolean {
      if (state.top + height <= PDF_CONTENT_BOTTOM) {
        return false;
      }

      state.page = createPdfPage(context);
      state.top = PDF_PAGE_MARGIN;

      return true;
    },

    advance(height: number): void {
      state.top += height;
    },
  };
}

/**
 * Заголовок секции в потоке: подпись прописными и линия под ней. В отличие от
 * панели переносится на новую страницу вместе с содержимым.
 *
 * @param context документ в процессе сборки.
 * @param flow поток содержимого.
 * @param title заголовок секции.
 * @param continued дописать пометку о продолжении.
 */
export function drawSectionHeader(
  context: PdfBuildContext,
  flow: PdfFlow,
  title: string,
  continued = false,
): void {
  const size = PDF_FONT_SIZES.panelTitle + 1.5;
  const suffix = continued ? PDF_CONTINUED_SUFFIX.toUpperCase() : '';

  flow.ensure(size + PDF_GAP * 3);

  drawTextLine(flow.page, {
    text: `${title.toUpperCase()}${suffix}`,
    left: flow.left,
    top: flow.top,
    font: context.fonts.display,
    size,
    letterSpacing: size * PDF_TITLE_LETTER_SPACING_RATIO,
    maxWidth: flow.width,
  });

  flow.advance(size + 3);

  drawRule(flow.page, {
    left: flow.left,
    top: flow.top,
    width: flow.width,
    color: PDF_COLORS.panelLine,
    thickness: PDF_LINE_WIDTH,
  });

  flow.advance(PDF_GAP);
}

/**
 * Отступ блока описания по его виду.
 *
 * @param kind вид блока.
 * @param level уровень вложенности списка.
 * @returns отступ слева в пунктах.
 */
function getBlockIndent(kind: PdfBlockKind, level: number): number {
  if (kind === 'listItem') {
    return PDF_LIST_INDENT * Math.max(1, level);
  }

  if (kind === 'quote') {
    return PDF_QUOTE_INDENT;
  }

  return 0;
}

/**
 * Отрисовка блоков описания в потоке с переносом строк и страниц. Поток с
 * `measuring` только двигает курсор: так высота описания меряется теми же
 * переносами, что и при отрисовке, без второй копии правил вёрстки.
 *
 * @param context документ в процессе сборки.
 * @param flow поток содержимого.
 * @param blocks блоки описания.
 * @param baseSize кегль текста описания.
 */
export function drawTextBlocks(
  context: PdfBuildContext,
  flow: PdfFlow,
  blocks: PdfTextBlock[],
  baseSize = PDF_FONT_SIZES.body,
): void {
  const isDrawing = !flow.measuring;

  for (const block of blocks) {
    if (block.kind === 'separator') {
      flow.ensure(PDF_GAP * 2);
      flow.advance(PDF_GAP);

      if (isDrawing) {
        drawRule(flow.page, {
          left: flow.left,
          top: flow.top,
          width: flow.width,
        });
      }

      flow.advance(PDF_GAP);

      continue;
    }

    if (block.kind === 'table') {
      drawFlowTableRows(context, flow, block.rows, baseSize);

      continue;
    }

    const indent = getBlockIndent(block.kind, block.level);
    const size = block.kind === 'heading' ? baseSize + 1.5 : baseSize;
    const lineHeight = size * PDF_LINE_HEIGHT_RATIO;

    const runs =
      block.kind === 'heading'
        ? block.runs.map((run) => ({ text: run.text, style: 'bold' as const }))
        : block.runs;

    const lines = wrapTextRuns(runs, context.fonts, size, flow.width - indent);

    for (const [index, line] of lines.entries()) {
      flow.ensure(lineHeight);

      if (!isDrawing) {
        flow.advance(lineHeight);

        continue;
      }

      if (block.kind === 'listItem' && index === 0) {
        drawTextLine(flow.page, {
          text: PDF_LIST_BULLET,
          left: flow.left + indent - PDF_LIST_INDENT * 0.7,
          top: flow.top,
          font: context.fonts.regular,
          size,
          color: PDF_COLORS.muted,
        });
      }

      if (block.kind === 'quote') {
        drawVerticalRule(flow.page, {
          left: flow.left + 1,
          top: flow.top,
          height: lineHeight,
        });
      }

      drawRunLine(
        context.fonts,
        flow.page,
        line,
        flow.left + indent,
        flow.top,
        size,
      );

      flow.advance(lineHeight);
    }

    flow.advance(PDF_GAP * 0.5);
  }
}

/**
 * Строки таблицы внутри описания: простая сетка без объединённых ячеек, первая
 * строка считается заголовком.
 *
 * @param context документ в процессе сборки.
 * @param flow поток содержимого.
 * @param rows строки таблицы по ячейкам.
 * @param baseSize кегль текста описания: таблица набирается чуть мельче.
 */
function drawFlowTableRows(
  context: PdfBuildContext,
  flow: PdfFlow,
  rows: string[][],
  baseSize: number,
): void {
  const columnCount = rows.reduce(
    (count, row) => Math.max(count, row.length),
    0,
  );

  if (!columnCount) {
    return;
  }

  const columnWidth = flow.width / columnCount;
  // Таблица на кегль мельче текста: при обычном теле (8) — те же 7, что были.
  const size = baseSize - 1;
  const lineHeight = size * PDF_LINE_HEIGHT_RATIO;

  for (const [rowIndex, row] of rows.entries()) {
    const font = rowIndex === 0 ? context.fonts.bold : context.fonts.regular;

    const cellLines = Array.from({ length: columnCount }, (_unused, index) =>
      wrapPlainText(row[index] ?? '', font, size, columnWidth - 4),
    );

    const rowHeight =
      cellLines.reduce((height, lines) => Math.max(height, lines.length), 1)
        * lineHeight
      + 2;

    flow.ensure(rowHeight);

    if (flow.measuring) {
      flow.advance(rowHeight);

      continue;
    }

    for (const [columnIndex, lines] of cellLines.entries()) {
      for (const [lineIndex, line] of lines.entries()) {
        drawTextLine(flow.page, {
          text: line,
          left: flow.left + columnWidth * columnIndex + 2,
          top: flow.top + lineHeight * lineIndex + 1,
          font,
          size,
          maxWidth: columnWidth - 4,
        });
      }
    }

    drawRule(flow.page, {
      left: flow.left,
      top: flow.top + rowHeight,
      width: flow.width,
    });

    flow.advance(rowHeight);
  }

  flow.advance(PDF_GAP * 0.5);
}

/**
 * Шапка таблицы: подписи столбцов и линия под ними.
 *
 * @param context документ в процессе сборки.
 * @param flow поток содержимого.
 * @param columns столбцы таблицы.
 */
export function drawTableHead(
  context: PdfBuildContext,
  flow: PdfFlow,
  columns: PdfTableColumn[],
): void {
  const size = PDF_FONT_SIZES.label;

  flow.ensure(PDF_DENSE_ROW_HEIGHT * 2);

  let cursor = flow.left;

  for (const column of columns) {
    drawTextLine(flow.page, {
      text: column.title.toUpperCase(),
      left: cursor,
      top: flow.top,
      font: context.fonts.bold,
      size,
      color: PDF_COLORS.muted,
      maxWidth: column.width,
      align: column.align,
    });

    cursor += column.width;
  }

  flow.advance(size + 3);

  drawRule(flow.page, {
    left: flow.left,
    top: flow.top,
    width: flow.width,
    color: PDF_COLORS.panelLine,
    thickness: PDF_LINE_WIDTH,
  });

  flow.advance(3);
}

/**
 * Строка таблицы по столбцам. Значения обрезаются по ширине столбца: перенос
 * внутри таблицы сбил бы выравнивание соседних столбцов.
 *
 * @param context документ в процессе сборки.
 * @param flow поток содержимого.
 * @param columns столбцы таблицы.
 * @param values значения по столбцам.
 * @param options выделение строки полужирным и разделитель под ней.
 */
export function drawTableRow(
  context: PdfBuildContext,
  flow: PdfFlow,
  columns: PdfTableColumn[],
  values: string[],
  options: PdfTableRowOptions = {},
): void {
  const size = PDF_FONT_SIZES.value;

  flow.ensure(PDF_ROW_HEIGHT);

  let cursor = flow.left;

  for (const [index, column] of columns.entries()) {
    drawTextLine(flow.page, {
      text: values[index] ?? '',
      left: cursor,
      top: flow.top + 1,
      font: options.bold ? context.fonts.bold : context.fonts.regular,
      size,
      maxWidth: column.width - 3,
      align: column.align,
    });

    cursor += column.width;
  }

  flow.advance(PDF_ROW_HEIGHT);

  if (options.divider !== false) {
    drawRule(flow.page, {
      left: flow.left,
      top: flow.top - 1,
      width: flow.width,
    });
  }
}

/**
 * Колонтитулы всех страниц: имя персонажа слева, сайт и номер страницы справа.
 * Рисуются в конце сборки — только тогда известно общее количество страниц.
 *
 * @param context документ в процессе сборки.
 */
export function drawPdfFooters(context: PdfBuildContext): void {
  const total = context.pages.length;
  const size = PDF_FONT_SIZES.footer;
  const top = PDF_PAGE_HEIGHT - PDF_PAGE_MARGIN - size;

  for (const [index, page] of context.pages.entries()) {
    drawRule(page, {
      left: PDF_PAGE_MARGIN,
      top: top - 4,
      width: PDF_PAGE_WIDTH - PDF_PAGE_MARGIN * 2,
    });

    drawTextLine(page, {
      text: context.characterName,
      left: PDF_PAGE_MARGIN,
      top,
      font: context.fonts.regular,
      size,
      color: PDF_COLORS.muted,
      maxWidth: PDF_PAGE_WIDTH / 2 - PDF_PAGE_MARGIN,
    });

    drawTextLine(page, {
      text: `${PDF_FOOTER_SITE}${PDF_NOTE_SEPARATOR}${PDF_FOOTER_PAGE_LABEL} ${index + 1}/${total}`,
      left: PDF_PAGE_WIDTH / 2,
      top,
      font: context.fonts.regular,
      size,
      color: PDF_COLORS.muted,
      maxWidth: PDF_PAGE_WIDTH / 2 - PDF_PAGE_MARGIN,
      align: 'right',
    });
  }
}
