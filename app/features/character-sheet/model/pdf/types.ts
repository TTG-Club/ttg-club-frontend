import type { Color, PDFDocument, PDFFont, PDFPage } from 'pdf-lib';

import type { SpellDetail } from '~character/model';
import type { ContentDescription } from '~content/model';

import type { SheetClassDetail, SheetDocument } from '../schema';
import type { ClassProgression, SheetStats } from '../types';

/**
 * Вид листа PDF. Пока один — раскладка сайта со справочником; печатный лист
 * Книги игрока 2014 добавится отдельным значением.
 */
export type SheetPdfVariant = 'ttg';

/** Лист, из которого собирается PDF: имя и документ. */
export interface PdfSheetSource {
  name: string;
  document: SheetDocument;
}

/**
 * Записи справочника, дозагруженные перед сборкой: в документе листа их нет.
 * Что не загрузилось, того в словарях нет — лист собирается и без них.
 */
export interface PdfCatalog {
  /** Карточки классов и подклассов по адресу: ячейки, умения, характеристика. */
  classes: ReadonlyMap<string, SheetClassDetail>;

  /** Карточки заклинаний по адресу. */
  spells: ReadonlyMap<string, SpellDetail>;

  /** Описания предметов по адресу. */
  items: ReadonlyMap<string, ContentDescription>;
}

/** Всё, что нужно страницам: документ, его итоги и справочник. */
export interface PdfSheet {
  name: string;
  document: SheetDocument;

  /** Итоги листа с механикой и эффектами — те же, что на сайте. */
  stats: SheetStats;

  catalog: PdfCatalog;

  /** Заклинательные данные классов по их карточкам. */
  progressions: ClassProgression[];
}

/** Встроенные в документ шрифты. */
export interface PdfFonts {
  /** Основной текст и значения. */
  regular: PDFFont;

  /** Полужирный: значения, заголовки строк. */
  bold: PDFFont;

  /** Курсив в описаниях. */
  italic: PDFFont;

  /** Акцидентный шрифт: имя персонажа и заголовки панелей. */
  display: PDFFont;
}

/** Документ в процессе сборки. */
export interface PdfBuildContext {
  document: PDFDocument;
  fonts: PdfFonts;

  /** Имя персонажа для колонтитула. */
  characterName: string;

  /** Созданные страницы в порядке добавления — для нумерации колонтитулов. */
  pages: PDFPage[];

  /**
   * Ссылка на просмотр листа для QR-кода в шапке; null — доступ по ссылке
   * выключен, и кода в документе нет.
   */
  shareUrl: string | null;
}

/** Необязательные данные сборки, которых нет в самом документе листа. */
export interface PdfBuildOptions {
  /** Ссылка на просмотр листа — попадёт в QR-код на первой странице. */
  shareUrl?: string | null;

  /** Вид листа; по умолчанию — раскладка сайта. */
  variant?: SheetPdfVariant;
}

/** Выравнивание текста внутри заданной ширины. */
export type PdfTextAlign = 'left' | 'center' | 'right';

/** Параметры отрисовки одной строки текста. */
export interface PdfTextOptions {
  text: string;

  /** Левая граница строки. */
  left: number;

  /** Координата верха строки, считая от верха страницы. */
  top: number;

  font: PDFFont;
  size: number;
  color?: Color;

  /** Максимальная ширина: не влезающий текст обрезается многоточием. */
  maxWidth?: number;

  /** Выравнивание внутри `maxWidth`; без ширины не применяется. */
  align?: PdfTextAlign;

  /** Разрядка между символами в пунктах. */
  letterSpacing?: number;
}

/** Начертание фрагмента текста описания. */
export type PdfTextStyle = 'regular' | 'bold' | 'italic';

/** Фрагмент описания с одним начертанием. */
export interface PdfTextRun {
  text: string;
  style: PdfTextStyle;
}

/** Вид блока описания. */
export type PdfBlockKind =
  'paragraph' | 'heading' | 'listItem' | 'quote' | 'separator' | 'table';

/** Блок описания, готовый к отрисовке в потоке. */
export interface PdfTextBlock {
  kind: PdfBlockKind;

  /** Фрагменты текста блока; у разделителя и таблицы — пустой массив. */
  runs: PdfTextRun[];

  /** Строки таблицы по ячейкам; заданы только у блока `table`. */
  rows: string[][];

  /** Уровень вложенности списка или уровень заголовка (с единицы). */
  level: number;
}

/** Поток содержимого с автоматическим переносом на новую страницу. */
export interface PdfFlow {
  /** Страница, на которую идёт отрисовка сейчас. */
  readonly page: PDFPage;

  /** Левая граница потока. */
  readonly left: number;

  /** Ширина потока. */
  readonly width: number;

  /** Координата курсора от верха страницы. */
  readonly top: number;

  /**
   * Поток только меряет: курсор двигается как при отрисовке, а на страницу
   * ничего не попадает.
   */
  readonly measuring?: boolean;

  /**
   * Гарантирует свободное место под блок высотой `height`; при нехватке
   * начинает новую страницу и возвращает true.
   *
   * @param height требуемая высота.
   */
  ensure: (height: number) => boolean;

  /**
   * Сдвигает курсор вниз.
   *
   * @param height высота сдвига.
   */
  advance: (height: number) => void;
}

/** Столбец таблицы: подпись, ширина и выравнивание. */
export interface PdfTableColumn {
  title: string;
  width: number;
  align: PdfTextAlign;
}

/** Место под блок: высоту задаёт содержимое. */
export interface PdfSlot {
  left: number;

  /** Координата верха от верха страницы. */
  top: number;

  width: number;
}

/** Место под блок с пределом высоты: содержимое обрезается по нему. */
export interface PdfBoundedSlot extends PdfSlot {
  maxHeight: number;
}

/** Прямоугольник с заданной высотой. */
export interface PdfRect extends PdfSlot {
  height: number;
}

/** Параметры горизонтального разделителя. */
export interface PdfRuleOptions extends PdfSlot {
  color?: Color;
  thickness?: number;
}

/** Параметры вертикальной линии. */
export interface PdfVerticalRuleOptions {
  left: number;
  top: number;
  height: number;
  color?: Color;
}

/** Параметры прямоугольника: заливка и рамка. */
export interface PdfBoxOptions extends PdfRect {
  fill?: Color;
  border?: Color;
  borderWidth?: number;
}

/** Параметры бокса со значением. */
export interface PdfValueBoxOptions extends PdfRect {
  label: string;
  value: string;

  /** Приписка под значением. */
  note?: string;

  /** Свой размер значения: длинная подпись крупным кеглем не влезает. */
  valueSize?: number;

  /** Свой размер приписки. */
  noteSize?: number;

  /** Приписка полужирным: так рисуется модификатор характеристики. */
  noteBold?: boolean;
}

/** Заливка кружка отметки. */
export type PdfMarkFill = 'none' | 'half' | 'full';

/** Параметры кружка отметки. */
export interface PdfMarkOptions {
  centerLeft: number;
  centerTop: number;
  fill: PdfMarkFill;

  /** Внешнее кольцо — компетентность в навыке. */
  ring?: boolean;
}

/** Параметры заголовка панели. */
export interface PdfPanelTitleOptions extends PdfSlot {
  title: string;
}

/** Параметры панели с рамкой. */
export interface PdfPanelOptions extends PdfPanelTitleOptions {
  page: PDFPage;

  /** Минимальная высота панели вместе с рамкой. */
  minHeight?: number;
}

/** Параметры создания потока содержимого. */
export interface PdfFlowOptions extends PdfSlot {
  /** Страница, с которой начинается поток; не передана — создаётся новая. */
  page?: PDFPage;
}

/** Оформление строки таблицы. */
export interface PdfTableRowOptions {
  /** Выделить строку полужирным (заголовок группы). */
  bold?: boolean;

  /** Рисовать разделитель под строкой; по умолчанию рисуется. */
  divider?: boolean;
}
