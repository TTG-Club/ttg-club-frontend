import type { PDFPage } from 'pdf-lib';

import type { SkillProficiency } from '../schema';
import type { PdfSkillRow, PdfSpellcasting } from './data';
import type {
  PdfBoundedSlot,
  PdfBuildContext,
  PdfMarkFill,
  PdfSheet,
  PdfSlot,
  PdfTableColumn,
} from './types';

import {
  ABILITY_LABELS,
  SHEET_SIZE_INFO,
  SPEED_UNIT_SHORT_LABELS,
} from '../constants';
import { formatDistanceValue } from '../settings';
import { formatModifier } from '../utils';
import {
  PDF_ABILITY_BOX_HEIGHT,
  PDF_ABILITY_BOX_WIDTH,
  PDF_COLORS,
  PDF_COMBAT_TILE_RATIOS,
  PDF_CONTENT_BOTTOM,
  PDF_CONTENT_WIDTH,
  PDF_DEATH_SAVE_COUNT,
  PDF_DENSE_ROW_HEIGHT,
  PDF_EMPTY_VALUE,
  PDF_FONT_SIZES,
  PDF_GAP,
  PDF_HEADER_BOX_WIDTH,
  PDF_HEADER_HEIGHT,
  PDF_HEALTH_BOX_HEIGHT,
  PDF_HIDDEN_FEATURES_LABEL,
  PDF_LABELS,
  PDF_MAIN_COLUMN_WIDTHS,
  PDF_MARK_RADIUS,
  PDF_PAGE_MARGIN,
  PDF_PANEL_PADDING,
  PDF_PANEL_TITLE_HEIGHT,
  PDF_REFERENCE_HINT,
  PDF_ROW_HEIGHT,
  PDF_TILE_HEIGHT,
  PDF_TITLES,
  PDF_VALUE_WIDTH_RATIO,
  PDF_WEAPON_COLUMN_RATIOS,
  PDF_WEAPON_COLUMNS,
  PDF_WEAPON_MIN_ROWS,
} from './constants';
import {
  getPdfAbilityRows,
  getPdfFeatureRows,
  getPdfHitDice,
  getPdfNextLevelExperience,
  getPdfProficiencyGroups,
  getPdfResourceRows,
  getPdfSenseRows,
  getPdfSpellcasting,
  getPdfSubtitle,
  getPdfWeaponRows,
} from './data';
import {
  createPdfPage,
  drawMark,
  drawPanel,
  drawRule,
  drawTextLine,
  drawValueBox,
  wrapPlainText,
} from './layout';
import { drawPdfQrCode } from './qr';

/** Параметры строки «подпись — значение». */
interface KeyValueRowOptions extends PdfSlot {
  label: string;
  value: string;
}

/** Плитка боевого показателя. */
interface CombatTile {
  label: string;
  value: string;

  /** Ширина плитки: в ряду они бывают разной ширины. */
  width: number;

  /** Приписка под значением. */
  note?: string;

  /** Свой размер значения: длинные подписи вроде размера крупным не влезают. */
  valueSize?: number;
}

/** Вид кружка владения по уровню владения навыком. */
const SKILL_MARK_FILL: Record<SkillProficiency, PdfMarkFill> = {
  none: 'none',
  half: 'half',
  proficient: 'full',
  expertise: 'full',
};

/**
 * Левая координата колонки первой страницы.
 *
 * @param column ключ колонки.
 * @returns левая граница колонки.
 */
function getColumnLeft(column: 'left' | 'center' | 'right'): number {
  if (column === 'left') {
    return PDF_PAGE_MARGIN;
  }

  if (column === 'center') {
    return PDF_PAGE_MARGIN + PDF_MAIN_COLUMN_WIDTHS.left + PDF_GAP;
  }

  return (
    PDF_PAGE_MARGIN
    + PDF_MAIN_COLUMN_WIDTHS.left
    + PDF_MAIN_COLUMN_WIDTHS.center
    + PDF_GAP * 2
  );
}

/**
 * Строка «подпись — значение» одной высоты со списками панелей.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param options геометрия, подпись и значение.
 */
function drawKeyValueRow(
  context: PdfBuildContext,
  page: PDFPage,
  options: KeyValueRowOptions,
): void {
  const size = PDF_FONT_SIZES.value;
  const valueWidth = options.width * PDF_VALUE_WIDTH_RATIO;

  drawTextLine(page, {
    text: options.label,
    left: options.left,
    top: options.top + 1,
    font: context.fonts.regular,
    size,
    color: PDF_COLORS.muted,
    maxWidth: options.width - valueWidth - 3,
  });

  drawTextLine(page, {
    text: options.value,
    left: options.left + options.width - valueWidth,
    top: options.top + 1,
    font: context.fonts.bold,
    size,
    maxWidth: valueWidth,
    align: 'right',
  });
}

/**
 * Шапка листа: имя, раса, классы и предыстория, боксы уровня, опыта и
 * вдохновения.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 */
function drawMainHeader(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
): void {
  // QR-код со ссылкой на лист — квадрат высотой в шапку у правого края; боксы
  // и имя сдвигаются левее, освобождая под него место.
  const qrWidth = context.shareUrl ? PDF_HEADER_HEIGHT + PDF_GAP : 0;

  const boxesWidth = PDF_HEADER_BOX_WIDTH * 3 + PDF_GAP * 2;
  const boxesLeft = PDF_PAGE_MARGIN + PDF_CONTENT_WIDTH - boxesWidth - qrWidth;

  if (context.shareUrl) {
    drawPdfQrCode(page, {
      text: context.shareUrl,
      left: PDF_PAGE_MARGIN + PDF_CONTENT_WIDTH - PDF_HEADER_HEIGHT,
      top: PDF_PAGE_MARGIN,
      width: PDF_HEADER_HEIGHT,
    });
  }

  drawTextLine(page, {
    text: sheet.name,
    left: PDF_PAGE_MARGIN,
    top: PDF_PAGE_MARGIN,
    font: context.fonts.display,
    size: PDF_FONT_SIZES.title,
    maxWidth: boxesLeft - PDF_PAGE_MARGIN - PDF_GAP,
  });

  drawTextLine(page, {
    text: getPdfSubtitle(sheet),
    left: PDF_PAGE_MARGIN,
    top: PDF_PAGE_MARGIN + PDF_FONT_SIZES.title + 6,
    font: context.fonts.regular,
    size: PDF_FONT_SIZES.subtitle,
    color: PDF_COLORS.muted,
    maxWidth: boxesLeft - PDF_PAGE_MARGIN - PDF_GAP,
  });

  drawValueBox(context, page, {
    left: boxesLeft,
    top: PDF_PAGE_MARGIN,
    width: PDF_HEADER_BOX_WIDTH,
    height: PDF_HEADER_HEIGHT,
    label: PDF_LABELS.level,
    value: String(sheet.stats.level),
    valueSize: PDF_FONT_SIZES.mediumValue + 4,
  });

  const nextLevel = getPdfNextLevelExperience(sheet);

  drawValueBox(context, page, {
    left: boxesLeft + PDF_HEADER_BOX_WIDTH + PDF_GAP,
    top: PDF_PAGE_MARGIN,
    width: PDF_HEADER_BOX_WIDTH,
    height: PDF_HEADER_HEIGHT,
    label: PDF_LABELS.experience,
    value: String(sheet.document.experience),
    note: nextLevel === null ? undefined : `/ ${nextLevel}`,
    valueSize: PDF_FONT_SIZES.mediumValue,
  });

  drawValueBox(context, page, {
    left: boxesLeft + (PDF_HEADER_BOX_WIDTH + PDF_GAP) * 2,
    top: PDF_PAGE_MARGIN,
    width: PDF_HEADER_BOX_WIDTH,
    height: PDF_HEADER_HEIGHT,
    label: PDF_LABELS.inspiration,
    value: '',
  });

  drawMark(page, {
    centerLeft:
      boxesLeft
      + (PDF_HEADER_BOX_WIDTH + PDF_GAP) * 2
      + PDF_HEADER_BOX_WIDTH / 2,
    centerTop: PDF_PAGE_MARGIN + PDF_HEADER_HEIGHT / 2 + 3,
    fill: sheet.document.inspiration ? 'full' : 'none',
  });
}

/**
 * Строка навыка: кружок владения, название и значение.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param skill навык.
 * @param options геометрия строки.
 */
function drawSkillRow(
  context: PdfBuildContext,
  page: PDFPage,
  skill: PdfSkillRow,
  options: PdfSlot,
): void {
  drawMark(page, {
    centerLeft: options.left + PDF_MARK_RADIUS,
    centerTop: options.top + PDF_ROW_HEIGHT / 2,
    fill: SKILL_MARK_FILL[skill.proficiency],
    ring: skill.proficiency === 'expertise',
  });

  drawTextLine(page, {
    text: skill.name,
    left: options.left + PDF_MARK_RADIUS * 2 + 4,
    top: options.top + 2,
    font: context.fonts.regular,
    size: PDF_FONT_SIZES.value,
    maxWidth: options.width - PDF_MARK_RADIUS * 2 - 30,
  });

  drawTextLine(page, {
    text: formatModifier(skill.bonus),
    left: options.left + options.width - 24,
    top: options.top + 2,
    font: context.fonts.regular,
    size: PDF_FONT_SIZES.value,
    maxWidth: 24,
    align: 'right',
  });
}

/**
 * Панель характеристик: бокс со значением и модификатором, справа — спасбросок
 * и навыки этой характеристики с кружком владения.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 * @param options геометрия панели.
 * @returns высота панели.
 */
function drawAbilitiesPanel(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
  options: PdfSlot,
): number {
  const abilityRows = getPdfAbilityRows(sheet);

  return drawPanel(
    context,
    { page, ...options, title: PDF_TITLES.abilities },
    (contentTop, contentWidth) => {
      const rowsLeft =
        options.left + PDF_PANEL_PADDING + PDF_ABILITY_BOX_WIDTH + 6;

      const rowsWidth = contentWidth - PDF_ABILITY_BOX_WIDTH - 6;

      let cursor = contentTop;

      for (const [index, abilityRow] of abilityRows.entries()) {
        drawValueBox(context, page, {
          left: options.left + PDF_PANEL_PADDING,
          top: cursor,
          width: PDF_ABILITY_BOX_WIDTH,
          height: PDF_ABILITY_BOX_HEIGHT,
          label: abilityRow.label,
          value: String(abilityRow.score),
          note: abilityRow.modifier,
          noteSize: PDF_FONT_SIZES.value,
          noteBold: true,
        });

        let rowTop = cursor;

        drawMark(page, {
          centerLeft: rowsLeft + PDF_MARK_RADIUS,
          centerTop: rowTop + PDF_ROW_HEIGHT / 2,
          fill: abilityRow.savingThrow.isProficient ? 'full' : 'none',
        });

        drawTextLine(page, {
          text: PDF_LABELS.savingThrow,
          left: rowsLeft + PDF_MARK_RADIUS * 2 + 4,
          top: rowTop + 2,
          font: context.fonts.bold,
          size: PDF_FONT_SIZES.value,
          maxWidth: rowsWidth - PDF_MARK_RADIUS * 2 - 30,
        });

        drawTextLine(page, {
          text: formatModifier(abilityRow.savingThrow.bonus),
          left: rowsLeft + rowsWidth - 24,
          top: rowTop + 2,
          font: context.fonts.bold,
          size: PDF_FONT_SIZES.value,
          maxWidth: 24,
          align: 'right',
        });

        rowTop += PDF_ROW_HEIGHT;

        for (const skill of abilityRow.skills) {
          drawSkillRow(context, page, skill, {
            left: rowsLeft,
            top: rowTop,
            width: rowsWidth,
          });

          rowTop += PDF_ROW_HEIGHT;
        }

        cursor =
          Math.max(cursor + PDF_ABILITY_BOX_HEIGHT, rowTop) + PDF_GAP * 0.8;

        if (index < abilityRows.length - 1) {
          drawRule(page, {
            left: options.left + PDF_PANEL_PADDING,
            top: cursor - PDF_GAP * 0.4,
            width: contentWidth,
          });
        }
      }

      return cursor - contentTop;
    },
  );
}

/**
 * Панель владений: доспехи, оружие, инструменты и языки — выданные
 * источниками и свои, как в панели листа.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 * @param options геометрия панели и предел высоты.
 * @returns высота панели.
 */
function drawProficienciesPanel(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
  options: PdfBoundedSlot,
): number {
  const groups = getPdfProficiencyGroups(sheet);

  return drawPanel(
    context,
    {
      page,
      left: options.left,
      top: options.top,
      width: options.width,
      title: PDF_TITLES.proficiencies,
      minHeight: options.maxHeight,
    },
    (contentTop, contentWidth) => {
      const labelSize = PDF_FONT_SIZES.label;
      const valueSize = PDF_FONT_SIZES.value;
      const valueLineHeight = PDF_DENSE_ROW_HEIGHT;

      let cursor = contentTop;

      for (const group of groups) {
        const text = group.values.join(', ') || PDF_EMPTY_VALUE;

        const lines = wrapPlainText(
          text,
          context.fonts.regular,
          valueSize,
          contentWidth,
        );

        const groupHeight = labelSize + 2 + lines.length * valueLineHeight + 3;

        if (cursor + groupHeight - contentTop > options.maxHeight) {
          break;
        }

        drawTextLine(page, {
          text: group.label.toUpperCase(),
          left: options.left + PDF_PANEL_PADDING,
          top: cursor,
          font: context.fonts.bold,
          size: labelSize,
          color: PDF_COLORS.muted,
          maxWidth: contentWidth,
        });

        cursor += labelSize + 2;

        for (const line of lines) {
          drawTextLine(page, {
            text: line,
            left: options.left + PDF_PANEL_PADDING,
            top: cursor,
            font: context.fonts.regular,
            size: valueSize,
            maxWidth: contentWidth,
          });

          cursor += valueLineHeight;
        }

        cursor += 3;
      }

      return cursor - contentTop;
    },
  );
}

/**
 * Ряд плиток боевых показателей. Ширина у плиток своя, поэтому левый край
 * каждой следующей набегает от предыдущей: умножение на номер увело бы ряд за
 * колонку, если ширины в нём разные.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param tiles плитки ряда слева направо.
 * @param position левый верхний угол ряда.
 * @param position.left левая граница ряда.
 * @param position.top верх ряда.
 */
function drawCombatTileRow(
  context: PdfBuildContext,
  page: PDFPage,
  tiles: CombatTile[],
  position: { left: number; top: number },
): void {
  let left = position.left;

  for (const tile of tiles) {
    drawValueBox(context, page, {
      left,
      top: position.top,
      width: tile.width,
      height: PDF_TILE_HEIGHT,
      label: tile.label,
      value: tile.value,
      note: tile.note,
      valueSize: tile.valueSize,
    });

    left += tile.width + PDF_GAP;
  }
}

/**
 * Плитки боевых показателей: класс доспеха, инициатива, скорость, бонус
 * мастерства, размер и истощение (PHB 2014 — ступени с 1 по 6).
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 * @param options геометрия блока.
 * @returns высота блока.
 */
function drawCombatTiles(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
  options: PdfSlot,
): number {
  const { document, stats } = sheet;

  // Ширина ряда без зазоров между плитками — от неё считаются и равные трети
  // первого ряда, и доли второго.
  const rowWidth = options.width - PDF_GAP * 2;
  const tileWidth = rowWidth / 3;

  const firstRow: CombatTile[] = [
    {
      label: PDF_LABELS.armorClass,
      value: String(stats.armorClass),
      width: tileWidth,
    },
    {
      label: PDF_LABELS.initiative,
      value: formatModifier(stats.initiative),
      width: tileWidth,
    },
    {
      // Скорость уже с нагрузкой, истощением и эффектами — как на листе.
      label: PDF_LABELS.speed,
      value: formatDistanceValue(stats.speeds.walk, document.speedUnit),
      note: SPEED_UNIT_SHORT_LABELS[document.speedUnit],
      width: tileWidth,
    },
  ];

  // Второй ряд — из плиток разной ширины: «Бонус мастерства» и размер целиком в
  // треть колонки не влезают, а сокращать подписи на листе нельзя.
  const secondRow: CombatTile[] = [
    {
      label: PDF_LABELS.proficiencyBonus,
      value: formatModifier(stats.proficiencyBonus),
      width: rowWidth * PDF_COMBAT_TILE_RATIOS.proficiencyBonus,
    },
    {
      label: PDF_LABELS.size,
      value: document.size ? SHEET_SIZE_INFO[document.size].name : '',
      valueSize: PDF_FONT_SIZES.mediumValue,
      width: rowWidth * PDF_COMBAT_TILE_RATIOS.size,
    },
    {
      label: PDF_LABELS.exhaustion,
      value: String(document.exhaustion),
      width: rowWidth * PDF_COMBAT_TILE_RATIOS.exhaustion,
    },
  ];

  drawCombatTileRow(context, page, firstRow, {
    left: options.left,
    top: options.top,
  });

  drawCombatTileRow(context, page, secondRow, {
    left: options.left,
    top: options.top + PDF_TILE_HEIGHT + PDF_GAP,
  });

  return PDF_TILE_HEIGHT * 2 + PDF_GAP;
}

/**
 * Спасброски от смерти: подпись и по три кружка на успехи и провалы;
 * отмеченные на листе закрашены.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 * @param options геометрия блока.
 */
function drawDeathSaves(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
  options: PdfSlot,
): void {
  drawTextLine(page, {
    text: PDF_LABELS.deathSaves.toUpperCase(),
    left: options.left,
    top: options.top,
    font: context.fonts.bold,
    size: PDF_FONT_SIZES.label,
    color: PDF_COLORS.muted,
    maxWidth: options.width,
  });

  const { successes, failures } = sheet.document.deathSaves;

  const rows = [
    { label: PDF_LABELS.deathSuccesses, marked: successes },
    { label: PDF_LABELS.deathFailures, marked: failures },
  ];

  const columnWidth = options.width / 2;

  for (const [index, row] of rows.entries()) {
    const left = options.left + columnWidth * index;
    const top = options.top + PDF_FONT_SIZES.label + 4;

    drawTextLine(page, {
      text: row.label,
      left,
      top: top + 1,
      font: context.fonts.regular,
      size: PDF_FONT_SIZES.value,
      color: PDF_COLORS.muted,
      maxWidth: columnWidth - 40,
    });

    for (let markIndex = 0; markIndex < PDF_DEATH_SAVE_COUNT; markIndex += 1) {
      drawMark(page, {
        centerLeft:
          left + columnWidth - 36 + markIndex * (PDF_MARK_RADIUS * 2 + 4),
        centerTop: top + PDF_FONT_SIZES.value / 2 + 1,
        fill: markIndex < row.marked ? 'full' : 'none',
      });
    }
  }
}

/**
 * Панель хитов: текущие, максимум и временные хиты, кости хитов и спасброски от
 * смерти.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 * @param options геометрия панели.
 * @returns высота панели.
 */
function drawHealthPanel(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
  options: PdfSlot,
): number {
  const { health } = sheet.document;

  return drawPanel(
    context,
    { page, ...options, title: PDF_TITLES.health },
    (contentTop, contentWidth) => {
      const boxWidth = (contentWidth - PDF_GAP * 2) / 3;
      const contentLeft = options.left + PDF_PANEL_PADDING;

      const boxes = [
        { label: PDF_LABELS.currentHits, value: String(health.current) },
        {
          label: PDF_LABELS.maxHits,
          value: String(sheet.stats.hitPointsMax),
        },
        { label: PDF_LABELS.temporaryHits, value: String(health.temporary) },
      ];

      for (const [index, box] of boxes.entries()) {
        drawValueBox(context, page, {
          left: contentLeft + (boxWidth + PDF_GAP) * index,
          top: contentTop,
          width: boxWidth,
          height: PDF_HEALTH_BOX_HEIGHT,
          label: box.label,
          value: box.value,
          valueSize: PDF_FONT_SIZES.mediumValue + 2,
        });
      }

      let cursor = contentTop + PDF_HEALTH_BOX_HEIGHT + PDF_GAP * 0.6;

      drawKeyValueRow(context, page, {
        left: contentLeft,
        top: cursor,
        width: contentWidth,
        label: PDF_LABELS.hitDice,
        value: getPdfHitDice(sheet) || PDF_EMPTY_VALUE,
      });

      cursor += PDF_ROW_HEIGHT;

      drawDeathSaves(context, page, sheet, {
        left: contentLeft,
        top: cursor,
        width: contentWidth,
      });

      return cursor + PDF_ROW_HEIGHT * 2 - contentTop;
    },
  );
}

/**
 * Панель оружия: название, бонус атаки и урон. Пустые строки оставлены под
 * запись от руки — как в бумажном листе.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 * @param options геометрия панели.
 * @returns высота панели.
 */
function drawWeaponsPanel(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
  options: PdfBoundedSlot,
): number {
  return drawPanel(
    context,
    {
      page,
      left: options.left,
      top: options.top,
      width: options.width,
      title: PDF_TITLES.weapons,
      minHeight: options.maxHeight,
    },
    (contentTop, contentWidth) => {
      const columns: PdfTableColumn[] = [
        {
          title: PDF_WEAPON_COLUMNS.name,
          width: contentWidth * PDF_WEAPON_COLUMN_RATIOS.name,
          align: 'left',
        },
        {
          title: PDF_WEAPON_COLUMNS.attack,
          width: contentWidth * PDF_WEAPON_COLUMN_RATIOS.attack,
          align: 'center',
        },
        {
          title: PDF_WEAPON_COLUMNS.damage,
          width: contentWidth * PDF_WEAPON_COLUMN_RATIOS.damage,
          align: 'left',
        },
      ];

      const contentLeft = options.left + PDF_PANEL_PADDING;
      const rows = getPdfWeaponRows(sheet);

      let cursor = contentTop;
      let columnLeft = contentLeft;

      for (const column of columns) {
        drawTextLine(page, {
          text: column.title.toUpperCase(),
          left: columnLeft,
          top: cursor,
          font: context.fonts.bold,
          size: PDF_FONT_SIZES.label,
          color: PDF_COLORS.muted,
          maxWidth: column.width,
          align: column.align,
        });

        columnLeft += column.width;
      }

      cursor += PDF_FONT_SIZES.label + 3;

      // Пустые строки до низа колонки: в бумажном листе оружие дописывают
      // ручкой, а обрезанная по содержимому панель оставляла полстраницы пустой.
      const availableRows = Math.floor(
        (options.maxHeight
          - PDF_PANEL_TITLE_HEIGHT
          - PDF_PANEL_PADDING * 2
          - PDF_FONT_SIZES.label
          - 3)
          / PDF_ROW_HEIGHT,
      );

      const rowCount = Math.max(
        rows.length,
        PDF_WEAPON_MIN_ROWS,
        availableRows,
      );

      for (let index = 0; index < rowCount; index += 1) {
        drawRule(page, {
          left: contentLeft,
          top: cursor,
          width: contentWidth,
        });

        const row = rows[index];

        if (row) {
          let valueLeft = contentLeft;

          for (const [columnIndex, column] of columns.entries()) {
            drawTextLine(page, {
              text: row[columnIndex] ?? '',
              left: valueLeft,
              top: cursor + 2,
              font: context.fonts.regular,
              size: PDF_FONT_SIZES.value,
              maxWidth: column.width - 3,
              align: column.align,
            });

            valueLeft += column.width;
          }
        }

        cursor += PDF_ROW_HEIGHT;
      }

      drawRule(page, { left: contentLeft, top: cursor, width: contentWidth });

      return cursor - contentTop;
    },
  );
}

/**
 * Панель заклинательства: характеристика, сложность спасброска и бонус атаки.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param spellcasting заклинательство персонажа.
 * @param options геометрия панели.
 * @returns высота панели.
 */
function drawSpellcastingPanel(
  context: PdfBuildContext,
  page: PDFPage,
  spellcasting: PdfSpellcasting,
  options: PdfSlot,
): number {
  return drawPanel(
    context,
    { page, ...options, title: PDF_TITLES.spellcasting },
    (contentTop, contentWidth) => {
      const rows = [
        {
          label: PDF_LABELS.spellAbility,
          value: ABILITY_LABELS[spellcasting.ability].name,
        },
        { label: PDF_LABELS.spellSaveDc, value: String(spellcasting.saveDc) },
        {
          label: PDF_LABELS.spellAttack,
          value: formatModifier(spellcasting.attack),
        },
      ];

      for (const [index, row] of rows.entries()) {
        drawKeyValueRow(context, page, {
          left: options.left + PDF_PANEL_PADDING,
          top: contentTop + PDF_ROW_HEIGHT * index,
          width: contentWidth,
          label: row.label,
          value: row.value,
        });
      }

      return PDF_ROW_HEIGHT * rows.length;
    },
  );
}

/**
 * Панель чувств и передвижения: пассивная Внимательность, особые чувства и
 * скорости.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 * @param options геометрия панели.
 * @returns высота панели.
 */
function drawSensesPanel(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
  options: PdfSlot,
): number {
  const rows = getPdfSenseRows(sheet);

  return drawPanel(
    context,
    { page, ...options, title: PDF_TITLES.senses },
    (contentTop, contentWidth) => {
      for (const [index, row] of rows.entries()) {
        drawKeyValueRow(context, page, {
          left: options.left + PDF_PANEL_PADDING,
          top: contentTop + PDF_ROW_HEIGHT * index,
          width: contentWidth,
          label: row.label,
          value: row.value,
        });
      }

      return PDF_ROW_HEIGHT * Math.max(rows.length, 1);
    },
  );
}

/**
 * Панель ресурсов: остаток зарядов и правило отдыха.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 * @param options геометрия панели.
 * @returns высота панели.
 */
function drawResourcesPanel(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
  options: PdfSlot,
): number {
  return drawPanel(
    context,
    { page, ...options, title: PDF_TITLES.classResources },
    (contentTop, contentWidth) => {
      const contentLeft = options.left + PDF_PANEL_PADDING;

      let cursor = contentTop;

      for (const resource of getPdfResourceRows(sheet)) {
        drawKeyValueRow(context, page, {
          left: contentLeft,
          top: cursor,
          width: contentWidth,
          label: resource.name,
          value: resource.value,
        });

        cursor += PDF_ROW_HEIGHT;

        // Восстановление — отдельной строкой: в скобках после названия оно
        // обрезалось, а знать его нужно на каждом отдыхе.
        drawTextLine(page, {
          text: resource.reset,
          left: contentLeft,
          top: cursor - 3,
          font: context.fonts.italic,
          size: PDF_FONT_SIZES.small,
          color: PDF_COLORS.muted,
          maxWidth: contentWidth,
        });

        cursor += PDF_FONT_SIZES.small + 3;
      }

      return cursor - contentTop;
    },
  );
}

/**
 * Панель особенностей: названия с источником и отсылка к полным описаниям.
 * Панель занимает остаток колонки, лишние особенности сворачиваются в счётчик.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 * @param options геометрия панели и предел высоты.
 * @returns высота панели.
 */
function drawFeaturesPanel(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
  options: PdfBoundedSlot,
): number {
  const features = getPdfFeatureRows(sheet);

  return drawPanel(
    context,
    {
      page,
      left: options.left,
      top: options.top,
      width: options.width,
      title: PDF_TITLES.features,
      minHeight: options.maxHeight,
    },
    (contentTop, contentWidth) => {
      const hintHeight = PDF_FONT_SIZES.small + 4;

      const visibleCount = Math.max(
        0,
        Math.floor((options.maxHeight - hintHeight) / PDF_DENSE_ROW_HEIGHT) - 1,
      );

      const visible = features.slice(0, visibleCount);
      const hidden = features.length - visible.length;

      let cursor = contentTop;

      for (const feature of visible) {
        drawTextLine(page, {
          text: feature.source
            ? `${feature.name} — ${feature.source}`
            : feature.name,
          left: options.left + PDF_PANEL_PADDING,
          top: cursor,
          font: context.fonts.regular,
          size: PDF_FONT_SIZES.value,
          maxWidth: contentWidth,
        });

        cursor += PDF_DENSE_ROW_HEIGHT;
      }

      if (hidden > 0) {
        drawTextLine(page, {
          text: `${PDF_HIDDEN_FEATURES_LABEL} ${hidden}`,
          left: options.left + PDF_PANEL_PADDING,
          top: cursor,
          font: context.fonts.italic,
          size: PDF_FONT_SIZES.value,
          color: PDF_COLORS.muted,
          maxWidth: contentWidth,
        });

        cursor += PDF_DENSE_ROW_HEIGHT;
      }

      if (features.some((feature) => feature.description)) {
        drawTextLine(page, {
          text: PDF_REFERENCE_HINT,
          left: options.left + PDF_PANEL_PADDING,
          top: cursor + 2,
          font: context.fonts.italic,
          size: PDF_FONT_SIZES.small,
          color: PDF_COLORS.muted,
          maxWidth: contentWidth,
        });

        cursor += hintHeight;
      }

      return cursor - contentTop;
    },
  );
}

/**
 * Первая страница листа: шапка и три колонки — характеристики с навыками и
 * владения, боевые показатели с хитами и оружием, правая колонка с
 * заклинательством, чувствами, ресурсами и особенностями.
 *
 * @param context документ в процессе сборки.
 * @param sheet лист.
 */
export function drawMainPage(context: PdfBuildContext, sheet: PdfSheet): void {
  const page = createPdfPage(context);

  drawMainHeader(context, page, sheet);

  const columnsTop = PDF_PAGE_MARGIN + PDF_HEADER_HEIGHT + PDF_GAP;

  const leftLeft = getColumnLeft('left');
  const centerLeft = getColumnLeft('center');
  const rightLeft = getColumnLeft('right');

  const abilitiesHeight = drawAbilitiesPanel(context, page, sheet, {
    left: leftLeft,
    top: columnsTop,
    width: PDF_MAIN_COLUMN_WIDTHS.left,
  });

  const proficienciesTop = columnsTop + abilitiesHeight + PDF_GAP;

  drawProficienciesPanel(context, page, sheet, {
    left: leftLeft,
    top: proficienciesTop,
    width: PDF_MAIN_COLUMN_WIDTHS.left,
    maxHeight: PDF_CONTENT_BOTTOM - proficienciesTop - PDF_GAP * 3,
  });

  let centerTop = columnsTop;

  centerTop +=
    drawCombatTiles(context, page, sheet, {
      left: centerLeft,
      top: centerTop,
      width: PDF_MAIN_COLUMN_WIDTHS.center,
    }) + PDF_GAP;

  centerTop +=
    drawHealthPanel(context, page, sheet, {
      left: centerLeft,
      top: centerTop,
      width: PDF_MAIN_COLUMN_WIDTHS.center,
    }) + PDF_GAP;

  drawWeaponsPanel(context, page, sheet, {
    left: centerLeft,
    top: centerTop,
    width: PDF_MAIN_COLUMN_WIDTHS.center,
    maxHeight: PDF_CONTENT_BOTTOM - centerTop - PDF_GAP,
  });

  let rightTop = columnsTop;

  const spellcasting = getPdfSpellcasting(sheet);

  if (spellcasting) {
    rightTop +=
      drawSpellcastingPanel(context, page, spellcasting, {
        left: rightLeft,
        top: rightTop,
        width: PDF_MAIN_COLUMN_WIDTHS.right,
      }) + PDF_GAP;
  }

  rightTop +=
    drawSensesPanel(context, page, sheet, {
      left: rightLeft,
      top: rightTop,
      width: PDF_MAIN_COLUMN_WIDTHS.right,
    }) + PDF_GAP;

  if (sheet.document.resources.length) {
    rightTop +=
      drawResourcesPanel(context, page, sheet, {
        left: rightLeft,
        top: rightTop,
        width: PDF_MAIN_COLUMN_WIDTHS.right,
      }) + PDF_GAP;
  }

  drawFeaturesPanel(context, page, sheet, {
    left: rightLeft,
    top: rightTop,
    width: PDF_MAIN_COLUMN_WIDTHS.right,
    maxHeight: PDF_CONTENT_BOTTOM - rightTop - PDF_GAP * 3,
  });
}
