import type { PDFPage } from 'pdf-lib';

import type { SkillProficiency } from '../schema';
import type { PdfBuildContext, PdfMarkFill, PdfRect, PdfSheet } from './types';

import {
  ABILITY_LABELS,
  CURRENCY_KEYS,
  CURRENCY_LABELS,
  HIT_DIE_LABEL_PREFIX,
  SPEED_UNIT_SHORT_LABELS,
} from '../constants';
import { formatDistanceValue } from '../settings';
import { formatModifier, getClassesLabel, getHitDiceTotals } from '../utils';
import { PDF_MARK_RADIUS, PDF_PAGE_MARGIN } from './constants';
import {
  getPdfAbilityRows,
  getPdfFeatureRows,
  getPdfInventoryGroups,
  getPdfProficiencyGroups,
  getPdfWeaponRows,
} from './data';
import {
  createPdfPage,
  drawMark,
  drawRule,
  drawTextLine,
  getTextWidth,
} from './layout';
import { toPdfPlainText } from './markup-text';
import {
  PHB_ABILITY_STRIP,
  PHB_ATTACK_COLUMN_RATIOS,
  PHB_BODY_BOTTOM,
  PHB_BODY_TOP,
  PHB_COINS,
  PHB_COLORS,
  PHB_COLUMN_GAP,
  PHB_COMBAT,
  PHB_DICE_SEPARATOR,
  PHB_FONT_SIZES,
  PHB_GAP,
  PHB_LABELS,
  PHB_LINE_HEIGHT,
  PHB_LINE_WIDTHS,
  PHB_MAIN_COLUMNS,
  PHB_PADDING,
  PHB_PERSONALITY_HEIGHTS,
  PHB_PLATE,
  PHB_ROW_HEIGHT,
  PHB_TITLE_HEIGHT,
} from './phb-constants';
import {
  drawPhbBanner,
  drawPhbBox,
  drawPhbCaption,
  drawPhbCenteredValue,
  drawPhbCircle,
  drawPhbGroup,
  drawPhbHeaderFields,
  drawPhbHexagon,
  drawPhbLinedText,
  drawPhbOval,
  drawPhbPanel,
  drawPhbShield,
} from './phb-layout';

/** Строка спасброска или навыка: владение, значение и название. */
interface PhbCheckRow {
  proficiency: SkillProficiency;
  bonus: number;
  name: string;

  /** Сокращение характеристики серым после названия; пусто — без него. */
  ability: string;
}

/** Вид кружка владения по уровню владения навыком. */
const PROFICIENCY_FILL: Record<SkillProficiency, PdfMarkFill> = {
  none: 'none',
  half: 'half',
  proficient: 'full',
  expertise: 'full',
};

/**
 * Левые границы колонок основной страницы.
 *
 * @returns левые границы левой, средней и правой колонок.
 */
function getColumnLefts(): { left: number; center: number; right: number } {
  const left = PDF_PAGE_MARGIN;
  const center = left + PHB_MAIN_COLUMNS.left + PHB_COLUMN_GAP;

  return {
    left,
    center,
    right: center + PHB_MAIN_COLUMNS.center + PHB_COLUMN_GAP,
  };
}

/**
 * Высота полосы характеристик: шесть блоков с зазорами и отступами.
 *
 * @returns высота полосы.
 */
function getAbilityStripHeight(): number {
  const { blockHeight, blockGap } = PHB_ABILITY_STRIP;

  return blockHeight * 6 + blockGap * 5 + PHB_PADDING * 2 + 4;
}

/**
 * Панель «Умения и особенности» в правой колонке: от её высоты зависит,
 * сколько особенностей уйдёт на страницу персонажа.
 *
 * @returns геометрия панели.
 */
function getFeaturesPanelRect(): PdfRect {
  const top =
    PHB_BODY_TOP
    + PHB_PADDING * 2
    + Object.values(PHB_PERSONALITY_HEIGHTS).reduce(
      (sum, height) => sum + height,
      0,
    )
    + PHB_GAP * 3
    + PHB_GAP;

  return {
    left: getColumnLefts().right,
    top,
    width: PHB_MAIN_COLUMNS.right,
    height: PHB_BODY_BOTTOM - top,
  };
}

/**
 * Сколько строк особенностей помещается на основной странице; остальные
 * продолжаются на странице персонажа.
 *
 * @returns число строк.
 */
export function getPhbMainFeatureCapacity(): number {
  const rect = getFeaturesPanelRect();

  return Math.floor(
    (rect.height - PHB_PADDING - PHB_TITLE_HEIGHT) / PHB_LINE_HEIGHT,
  );
}

/**
 * Особенности строками списка: название и источник.
 *
 * @param sheet лист.
 * @returns строки особенностей по порядку листа.
 */
export function getPhbFeatureLines(sheet: PdfSheet): string[] {
  return getPdfFeatureRows(sheet).map((feature) => {
    const choice = feature.choice ? ` (${feature.choice})` : '';
    const source = feature.source ? ` — ${feature.source}` : '';

    return `${feature.name}${choice}${source}`;
  });
}

/**
 * Текст из блоков разметки абзацами.
 *
 * @param blocks блоки разметки.
 * @returns абзацы простым текстом.
 */
export function getPhbParagraphs(blocks: ReadonlyArray<string>): string[] {
  return blocks
    .map((block) => toPdfPlainText([block]))
    .filter((paragraph) => paragraph.trim());
}

/**
 * Кости хитов строкой: «2к10 + 5к6».
 *
 * @param entries размеры кости и сколько их.
 * @returns подпись костей.
 */
function formatDice(entries: Array<{ die: number; count: number }>): string {
  return entries
    .filter((entry) => entry.count > 0)
    .map((entry) => `${entry.count}${HIT_DIE_LABEL_PREFIX}${entry.die}`)
    .join(PHB_DICE_SEPARATOR);
}

/**
 * Шапка основной страницы: лента с именем и шесть полей.
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
  const { document } = sheet;

  drawPhbBanner(context, page, {
    label: PHB_LABELS.characterName,
    value: sheet.name,
    qrText: context.shareUrl,
  });

  drawPhbHeaderFields(context, page, [
    {
      label: PHB_LABELS.classLevel,
      value: document.classes.length ? getClassesLabel(document.classes) : '',
    },
    { label: PHB_LABELS.background, value: document.background?.name ?? '' },
    { label: PHB_LABELS.playerName, value: '' },
    { label: PHB_LABELS.race, value: document.race?.name ?? '' },
    { label: PHB_LABELS.alignment, value: document.alignment },
    { label: PHB_LABELS.experience, value: String(document.experience) },
  ]);
}

/**
 * Полоса характеристик: подпись, крупный модификатор и овал со значением.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 * @param rect геометрия полосы.
 */
function drawAbilityStrip(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
  rect: PdfRect,
): void {
  const { blockWidth, blockHeight, blockGap, ovalRadiusX, ovalRadiusY } =
    PHB_ABILITY_STRIP;

  drawPhbGroup(page, rect);

  const blockLeft = rect.left + (rect.width - blockWidth) / 2;

  for (const [index, ability] of getPdfAbilityRows(sheet).entries()) {
    const top = rect.top + PHB_PADDING + (blockHeight + blockGap) * index;

    drawPhbBox(page, {
      left: blockLeft,
      top,
      width: blockWidth,
      height: blockHeight - ovalRadiusY,
    });

    drawPhbCaption(context, page, {
      text: ability.label,
      left: blockLeft + 1,
      top: top + 4,
      width: blockWidth - 2,
      size: PHB_FONT_SIZES.small,
    });

    drawPhbCenteredValue(context, page, {
      text: ability.modifier,
      left: blockLeft,
      width: blockWidth,
      size: PHB_FONT_SIZES.big,
      centerTop: top + (blockHeight - ovalRadiusY) / 2 + 2,
    });

    const ovalTop = top + blockHeight - ovalRadiusY - 1;

    drawPhbOval(
      page,
      blockLeft + blockWidth / 2,
      ovalTop,
      ovalRadiusX,
      ovalRadiusY,
    );

    drawPhbCenteredValue(context, page, {
      text: String(ability.score),
      left: blockLeft,
      width: blockWidth,
      size: PHB_FONT_SIZES.rowValue + 1,
      centerTop: ovalTop,
    });
  }
}

/**
 * Плашка с отметкой слева: кружок со значением (бонус мастерства, пассивная
 * мудрость) или квадрат (вдохновение).
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param options геометрия, подпись и отметка.
 * @param options.label подпись плашки.
 * @param options.value значение в кружке; null — квадрат вдохновения.
 * @param options.isChecked квадрат отмечен.
 */
function drawPlate(
  context: PdfBuildContext,
  page: PDFPage,
  options: PdfRect & {
    label: string;
    value: string | null;
    isChecked?: boolean;
  },
): void {
  const { markRadius } = PHB_PLATE;
  const centerTop = options.top + options.height / 2;
  const centerLeft = options.left + markRadius;

  drawPhbBox(page, {
    left: options.left + markRadius,
    top: options.top + 2,
    width: options.width - markRadius,
    height: options.height - 4,
    radius: 3,
  });

  if (options.value === null) {
    const side = markRadius * 1.6;

    drawPhbBox(page, {
      left: centerLeft - side / 2,
      top: centerTop - side / 2,
      width: side,
      height: side,
      radius: 1.5,
      fill: options.isChecked ? PHB_COLORS.ink : PHB_COLORS.field,
    });
  } else {
    drawPhbCircle(page, centerLeft, centerTop, markRadius);

    drawPhbCenteredValue(context, page, {
      text: options.value,
      left: centerLeft - markRadius,
      width: markRadius * 2,
      size: PHB_FONT_SIZES.medium - 1,
      centerTop,
    });
  }

  drawPhbCaption(context, page, {
    text: options.label,
    left: centerLeft + markRadius + 4,
    top: centerTop - PHB_FONT_SIZES.title / 2 - 1,
    width: options.width - markRadius * 2 - 8,
    align: 'left',
  });
}

/**
 * Строки спасбросков или навыков: кружок владения, значение на линии,
 * название и сокращение характеристики серым.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param rows строки.
 * @param area область строк.
 */
function drawCheckRows(
  context: PdfBuildContext,
  page: PDFPage,
  rows: PhbCheckRow[],
  area: PdfRect,
): void {
  const rowHeight = Math.min(PHB_ROW_HEIGHT * 1.3, area.height / rows.length);
  const size = PHB_FONT_SIZES.line;
  const valueLeft = area.left + PDF_MARK_RADIUS * 2 + 3;
  const valueWidth = 15;
  const nameLeft = valueLeft + valueWidth + 3;

  for (const [index, row] of rows.entries()) {
    const top = area.top + rowHeight * index;
    const baseline = top + rowHeight - 2;

    drawMark(page, {
      centerLeft: area.left + PDF_MARK_RADIUS,
      centerTop: baseline - size / 2 + 0.5,
      fill: PROFICIENCY_FILL[row.proficiency],
      ring: row.proficiency === 'expertise',
    });

    drawTextLine(page, {
      text: formatModifier(row.bonus),
      left: valueLeft,
      top: baseline - size - 0.5,
      font: context.fonts.bold,
      size,
      color: PHB_COLORS.ink,
      maxWidth: valueWidth,
      align: 'center',
    });

    drawRule(page, {
      left: valueLeft,
      top: baseline + 0.5,
      width: valueWidth,
      color: PHB_COLORS.ink,
      thickness: PHB_LINE_WIDTHS.thin,
    });

    const nameWidth = area.left + area.width - nameLeft;

    drawTextLine(page, {
      text: row.name,
      left: nameLeft,
      top: baseline - size - 0.5,
      font: context.fonts.regular,
      size,
      color: PHB_COLORS.ink,
      maxWidth: nameWidth,
    });

    if (row.ability) {
      const used = getTextWidth(row.name, context.fonts.regular, size) + 2;

      drawTextLine(page, {
        text: `(${row.ability})`,
        left: nameLeft + used,
        top: baseline - size - 0.5,
        font: context.fonts.regular,
        size: size - 0.6,
        color: PHB_COLORS.muted,
        maxWidth: Math.max(0, nameWidth - used),
      });
    }
  }
}

/**
 * Левая колонка: полоса характеристик, вдохновение, бонус мастерства,
 * спасброски, навыки, пассивная мудрость и прочие владения.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 */
function drawLeftColumn(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
): void {
  const { left } = getColumnLefts();
  const columnWidth = PHB_MAIN_COLUMNS.left;
  const stripHeight = getAbilityStripHeight();
  const stripBottom = PHB_BODY_TOP + stripHeight;
  const abilityRows = getPdfAbilityRows(sheet);

  drawAbilityStrip(context, page, sheet, {
    left,
    top: PHB_BODY_TOP,
    width: PHB_ABILITY_STRIP.width,
    height: stripHeight,
  });

  const stackLeft = left + PHB_ABILITY_STRIP.width + PHB_GAP;
  const stackWidth = columnWidth - PHB_ABILITY_STRIP.width - PHB_GAP;

  let cursor = PHB_BODY_TOP;

  drawPlate(context, page, {
    left: stackLeft,
    top: cursor,
    width: stackWidth,
    height: PHB_PLATE.height,
    label: PHB_LABELS.inspiration,
    value: null,
    isChecked: sheet.document.inspiration,
  });

  cursor += PHB_PLATE.height + PHB_GAP;

  drawPlate(context, page, {
    left: stackLeft,
    top: cursor,
    width: stackWidth,
    height: PHB_PLATE.height,
    label: PHB_LABELS.proficiencyBonus,
    value: formatModifier(sheet.stats.proficiencyBonus),
  });

  cursor += PHB_PLATE.height + PHB_GAP;

  const savesHeight =
    PHB_ROW_HEIGHT * abilityRows.length + PHB_PADDING + PHB_TITLE_HEIGHT + 4;

  const savesArea = drawPhbPanel(
    context,
    page,
    { left: stackLeft, top: cursor, width: stackWidth, height: savesHeight },
    PHB_LABELS.savingThrows,
  );

  drawCheckRows(
    context,
    page,
    abilityRows.map((ability) => ({
      proficiency: ability.savingThrow.isProficient ? 'proficient' : 'none',
      bonus: ability.savingThrow.bonus,
      name: ability.label,
      ability: '',
    })),
    savesArea,
  );

  cursor += savesHeight + PHB_GAP;

  const skills = abilityRows
    .flatMap((ability) =>
      ability.skills.map((skill) => ({
        ...skill,
        ability: ABILITY_LABELS[ability.key].short,
      })),
    )
    .sort((first, second) => first.name.localeCompare(second.name, 'ru'));

  const skillsArea = drawPhbPanel(
    context,
    page,
    {
      left: stackLeft,
      top: cursor,
      width: stackWidth,
      height: stripBottom - cursor,
    },
    PHB_LABELS.skills,
  );

  drawCheckRows(context, page, skills, skillsArea);

  const passiveTop = stripBottom + PHB_GAP;

  drawPlate(context, page, {
    left,
    top: passiveTop,
    width: columnWidth,
    height: PHB_PLATE.height,
    label: PHB_LABELS.passivePerception,
    value: String(sheet.stats.passivePerception),
  });

  const otherTop = passiveTop + PHB_PLATE.height + PHB_GAP;

  const otherArea = drawPhbPanel(
    context,
    page,
    {
      left,
      top: otherTop,
      width: columnWidth,
      height: PHB_BODY_BOTTOM - otherTop,
    },
    PHB_LABELS.otherProficiencies,
  );

  drawPhbLinedText(context, page, otherArea, {
    paragraphs: getPdfProficiencyGroups(sheet)
      .filter((group) => group.values.length)
      .map((group) => `${group.label}: ${group.values.join(', ')}`),
  });
}

/**
 * Рамка значения с подписью внизу: инициатива и скорость.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param options геометрия, подпись, значение и приписка.
 * @param options.label подпись.
 * @param options.value значение.
 * @param options.note приписка под значением.
 */
function drawStatBox(
  context: PdfBuildContext,
  page: PDFPage,
  options: PdfRect & { label: string; value: string; note?: string },
): void {
  drawPhbPanel(context, page, options, options.label);

  drawPhbCenteredValue(context, page, {
    text: options.value,
    left: options.left,
    width: options.width,
    size: PHB_FONT_SIZES.big,
    centerTop: options.top + (options.height - PHB_TITLE_HEIGHT) / 2 + 1,
  });

  if (options.note) {
    drawTextLine(page, {
      text: options.note,
      left: options.left,
      top:
        options.top
        + options.height
        - PHB_TITLE_HEIGHT
        - PHB_FONT_SIZES.small
        - 2,
      font: context.fonts.regular,
      size: PHB_FONT_SIZES.small,
      color: PHB_COLORS.label,
      maxWidth: options.width,
      align: 'center',
    });
  }
}

/**
 * Боевой блок средней колонки: КД, инициатива и скорость, хиты, кости хитов и
 * спасброски от смерти в серой рамке.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 * @returns низ блока.
 */
function drawCombatBlock(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
): number {
  const { document, stats } = sheet;
  const left = getColumnLefts().center;
  const width = PHB_MAIN_COLUMNS.center;
  const innerLeft = left + PHB_PADDING;
  const innerWidth = width - PHB_PADDING * 2;

  const height =
    PHB_PADDING * 2
    + PHB_COMBAT.statHeight
    + PHB_COMBAT.currentHitsHeight
    + PHB_COMBAT.temporaryHitsHeight
    + PHB_COMBAT.squareHeight
    + PHB_GAP * 3;

  drawPhbGroup(page, { left, top: PHB_BODY_TOP, width, height });

  let cursor = PHB_BODY_TOP + PHB_PADDING;

  // КД — щит, инициатива и скорость — рамки той же высоты.
  const statWidth = (innerWidth - PHB_GAP * 2) / 3;
  const shieldLeft = innerLeft + (statWidth - PHB_COMBAT.shieldWidth) / 2;

  drawPhbShield(page, {
    left: shieldLeft,
    top: cursor,
    width: PHB_COMBAT.shieldWidth,
    height: PHB_COMBAT.statHeight,
  });

  drawPhbCenteredValue(context, page, {
    text: String(stats.armorClass),
    left: shieldLeft,
    width: PHB_COMBAT.shieldWidth,
    size: PHB_FONT_SIZES.big,
    centerTop: cursor + PHB_COMBAT.statHeight * 0.38,
  });

  drawPhbCaption(context, page, {
    text: PHB_LABELS.armorClass,
    left: shieldLeft,
    top: cursor + PHB_COMBAT.statHeight * 0.66,
    width: PHB_COMBAT.shieldWidth,
  });

  drawStatBox(context, page, {
    left: innerLeft + statWidth + PHB_GAP,
    top: cursor,
    width: statWidth,
    height: PHB_COMBAT.statHeight,
    label: PHB_LABELS.initiative,
    value: formatModifier(stats.initiative),
  });

  drawStatBox(context, page, {
    left: innerLeft + (statWidth + PHB_GAP) * 2,
    top: cursor,
    width: statWidth,
    height: PHB_COMBAT.statHeight,
    label: PHB_LABELS.speed,
    value: formatDistanceValue(stats.speeds.walk, document.speedUnit),
    note: SPEED_UNIT_SHORT_LABELS[document.speedUnit],
  });

  cursor += PHB_COMBAT.statHeight + PHB_GAP;

  // Текущие хиты: максимум — строкой с линией сверху, как на печатном листе.
  const currentRect = {
    left: innerLeft,
    top: cursor,
    width: innerWidth,
    height: PHB_COMBAT.currentHitsHeight,
  };

  drawPhbPanel(context, page, currentRect, PHB_LABELS.currentHits);

  drawTextLine(page, {
    text: PHB_LABELS.maxHits,
    left: innerLeft + PHB_PADDING,
    top: cursor + PHB_PADDING,
    font: context.fonts.regular,
    size: PHB_FONT_SIZES.small,
    color: PHB_COLORS.label,
  });

  const maxLabelWidth =
    getTextWidth(
      PHB_LABELS.maxHits,
      context.fonts.regular,
      PHB_FONT_SIZES.small,
    ) + 4;

  const maxLeft = innerLeft + PHB_PADDING + maxLabelWidth;
  const maxWidth = innerWidth - PHB_PADDING * 2 - maxLabelWidth;

  drawTextLine(page, {
    text: String(stats.hitPointsMax),
    left: maxLeft,
    top: cursor + PHB_PADDING - 1.5,
    font: context.fonts.bold,
    size: PHB_FONT_SIZES.rowValue,
    color: PHB_COLORS.ink,
    maxWidth,
    align: 'center',
  });

  drawRule(page, {
    left: maxLeft,
    top: cursor + PHB_PADDING + PHB_FONT_SIZES.small + 2,
    width: maxWidth,
    color: PHB_COLORS.line,
    thickness: PHB_LINE_WIDTHS.thin,
  });

  drawPhbCenteredValue(context, page, {
    text: String(document.health.current),
    left: innerLeft,
    width: innerWidth,
    size: PHB_FONT_SIZES.big + 4,
    centerTop: cursor + PHB_COMBAT.currentHitsHeight / 2 + 2,
  });

  cursor += PHB_COMBAT.currentHitsHeight + PHB_GAP;

  drawStatBox(context, page, {
    left: innerLeft,
    top: cursor,
    width: innerWidth,
    height: PHB_COMBAT.temporaryHitsHeight,
    label: PHB_LABELS.temporaryHits,
    value: document.health.temporary ? String(document.health.temporary) : '',
  });

  cursor += PHB_COMBAT.temporaryHitsHeight + PHB_GAP;

  const squareWidth = (innerWidth - PHB_GAP) / 2;

  drawHitDice(context, page, sheet, {
    left: innerLeft,
    top: cursor,
    width: squareWidth,
    height: PHB_COMBAT.squareHeight,
  });

  drawDeathSaves(context, page, sheet, {
    left: innerLeft + squareWidth + PHB_GAP,
    top: cursor,
    width: squareWidth,
    height: PHB_COMBAT.squareHeight,
  });

  return PHB_BODY_TOP + height;
}

/**
 * Кость хитов: всего по размерам сверху и остаток посередине.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 * @param rect геометрия квадрата.
 */
function drawHitDice(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
  rect: PdfRect,
): void {
  const totals = getHitDiceTotals(sheet.document);

  drawPhbPanel(context, page, rect, PHB_LABELS.hitDice);

  drawTextLine(page, {
    text: `${PHB_LABELS.hitDiceTotal} ${formatDice(totals.map((entry) => ({ die: entry.die, count: entry.total })))}`,
    left: rect.left + PHB_PADDING,
    top: rect.top + PHB_PADDING,
    font: context.fonts.regular,
    size: PHB_FONT_SIZES.small,
    color: PHB_COLORS.label,
    maxWidth: rect.width - PHB_PADDING * 2,
  });

  drawPhbCenteredValue(context, page, {
    text: formatDice(
      totals.map((entry) => ({
        die: entry.die,
        count: entry.total - entry.used,
      })),
    ),
    left: rect.left + PHB_PADDING,
    width: rect.width - PHB_PADDING * 2,
    size: PHB_FONT_SIZES.medium - 1,
    centerTop: rect.top + (rect.height - PHB_TITLE_HEIGHT) / 2 + 3,
  });
}

/**
 * Спасброски от смерти: по три кружка на успехи и провалы, отмеченные на
 * листе закрашены.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 * @param rect геометрия квадрата.
 */
function drawDeathSaves(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
  rect: PdfRect,
): void {
  const { successes, failures } = sheet.document.deathSaves;

  drawPhbPanel(context, page, rect, PHB_LABELS.deathSaves);

  const rows = [
    { label: PHB_LABELS.successes, marked: successes },
    { label: PHB_LABELS.failures, marked: failures },
  ];

  const marksWidth = PDF_MARK_RADIUS * 2 * 3 + 8;
  const marksLeft = rect.left + rect.width - PHB_PADDING - marksWidth;

  for (const [index, row] of rows.entries()) {
    const centerTop = rect.top + PHB_PADDING + 9 + index * 16;

    drawPhbCaption(context, page, {
      text: row.label,
      left: rect.left + PHB_PADDING,
      top: centerTop - PHB_FONT_SIZES.label / 2 - 1,
      width: marksLeft - rect.left - PHB_PADDING - 2,
      size: PHB_FONT_SIZES.label,
      align: 'left',
    });

    drawRule(page, {
      left: marksLeft + PDF_MARK_RADIUS,
      top: centerTop,
      width: marksWidth - PDF_MARK_RADIUS * 2,
      color: PHB_COLORS.ink,
      thickness: PHB_LINE_WIDTHS.thin,
    });

    for (let markIndex = 0; markIndex < 3; markIndex += 1) {
      drawMark(page, {
        centerLeft:
          marksLeft + PDF_MARK_RADIUS + markIndex * (PDF_MARK_RADIUS * 2 + 4),
        centerTop,
        fill: markIndex < row.marked ? 'full' : 'none',
      });
    }
  }
}

/**
 * Атаки и заклинания: таблица атак оружием серыми строками, ниже линовка под
 * остальные атаки.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 * @param rect геометрия панели.
 */
function drawAttacks(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
  rect: PdfRect,
): void {
  const area = drawPhbPanel(context, page, rect, PHB_LABELS.attacks);
  const rows = getPdfWeaponRows(sheet);

  const columns = [
    { title: PHB_LABELS.attackName, ratio: PHB_ATTACK_COLUMN_RATIOS.name },
    { title: PHB_LABELS.attackBonus, ratio: PHB_ATTACK_COLUMN_RATIOS.bonus },
    { title: PHB_LABELS.attackDamage, ratio: PHB_ATTACK_COLUMN_RATIOS.damage },
  ].map((column) => ({ ...column, width: area.width * column.ratio }));

  let columnLeft = area.left;

  for (const column of columns) {
    drawPhbCaption(context, page, {
      text: column.title,
      left: columnLeft + 1,
      top: area.top,
      width: column.width - 2,
      size: PHB_FONT_SIZES.label,
      align: 'left',
    });

    columnLeft += column.width;
  }

  const rowHeight = PHB_COMBAT.attackRowHeight;
  const tableTop = area.top + PHB_FONT_SIZES.label + 3;

  const maxRows = Math.floor(
    (area.height - (tableTop - area.top)) / (rowHeight + 2),
  );

  const rowCount = Math.min(
    maxRows,
    Math.max(PHB_COMBAT.attackMinRows, rows.length),
  );

  for (let index = 0; index < rowCount; index += 1) {
    const top = tableTop + (rowHeight + 2) * index;
    const row = rows[index];

    let cellLeft = area.left;

    for (const [columnIndex, column] of columns.entries()) {
      drawPhbBox(page, {
        left: cellLeft + 0.5,
        top,
        width: column.width - 1,
        height: rowHeight,
        radius: 1.5,
        fill: PHB_COLORS.row,
        borderWidth: 0,
      });

      drawTextLine(page, {
        text: row?.[columnIndex] ?? '',
        left: cellLeft + 2,
        top: top + (rowHeight - PHB_FONT_SIZES.line) / 2 - 0.5,
        font: columnIndex === 1 ? context.fonts.bold : context.fonts.regular,
        size: PHB_FONT_SIZES.line,
        color: PHB_COLORS.ink,
        maxWidth: column.width - 4,
        align: columnIndex === 1 ? 'center' : 'left',
      });

      cellLeft += column.width;
    }
  }

  const linesTop = tableTop + (rowHeight + 2) * rowCount + 2;

  // Атаки, не влезшие в серые строки, продолжаются на линовке.
  drawPhbLinedText(
    context,
    page,
    {
      left: area.left,
      top: linesTop,
      width: area.width,
      height: area.top + area.height - linesTop,
    },
    {
      paragraphs: rows
        .slice(rowCount)
        .map((row) => row.filter(Boolean).join(' · ')),
      isList: true,
    },
  );
}

/**
 * Снаряжение: столбик монет слева и список предметов на линовке справа.
 * Магические предметы печатаются в «Сокровищах» на странице персонажа.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 * @param rect геометрия панели.
 */
function drawEquipment(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
  rect: PdfRect,
): void {
  const area = drawPhbPanel(context, page, rect, PHB_LABELS.equipment);

  for (const [index, key] of CURRENCY_KEYS.entries()) {
    const top = area.top + (PHB_COINS.height + PHB_COINS.gap) * index;

    drawPhbHexagon(page, {
      left: area.left,
      top,
      width: PHB_COINS.width,
      height: PHB_COINS.height,
    });

    drawPhbCaption(context, page, {
      text: CURRENCY_LABELS[key],
      left: area.left,
      top: top + 3,
      width: PHB_COINS.width,
      size: PHB_FONT_SIZES.label,
    });

    drawPhbCenteredValue(context, page, {
      text: String(sheet.document.currency[key]),
      left: area.left + 4,
      width: PHB_COINS.width - 8,
      size: PHB_FONT_SIZES.rowValue + 1,
      centerTop: top + PHB_COINS.height / 2 + 3,
    });
  }

  const listLeft = area.left + PHB_COINS.width + PHB_GAP;

  drawPhbLinedText(
    context,
    page,
    {
      left: listLeft,
      top: area.top,
      width: area.left + area.width - listLeft,
      height: area.height,
    },
    {
      paragraphs: getPdfInventoryGroups(sheet)
        .filter((group) => group.key !== 'magic')
        .flatMap((group) => group.items)
        .map((item) =>
          item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name,
        ),
      isList: true,
    },
  );
}

/**
 * Средняя колонка: боевой блок, атаки и снаряжение.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 */
function drawCenterColumn(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
): void {
  const left = getColumnLefts().center;
  const width = PHB_MAIN_COLUMNS.center;
  const combatBottom = drawCombatBlock(context, page, sheet);
  const attacksTop = combatBottom + PHB_GAP;

  drawAttacks(context, page, sheet, {
    left,
    top: attacksTop,
    width,
    height: PHB_COMBAT.attacksHeight,
  });

  const equipmentTop = attacksTop + PHB_COMBAT.attacksHeight + PHB_GAP;

  drawEquipment(context, page, sheet, {
    left,
    top: equipmentTop,
    width,
    height: PHB_BODY_BOTTOM - equipmentTop,
  });
}

/**
 * Правая колонка: черты характера, идеалы, привязанности и слабости в серой
 * рамке, ниже — умения и особенности.
 *
 * @param context документ в процессе сборки.
 * @param page страница.
 * @param sheet лист.
 */
function drawRightColumn(
  context: PdfBuildContext,
  page: PDFPage,
  sheet: PdfSheet,
): void {
  const left = getColumnLefts().right;
  const width = PHB_MAIN_COLUMNS.right;
  const { personality } = sheet.document;

  const panels = [
    {
      title: PHB_LABELS.traits,
      height: PHB_PERSONALITY_HEIGHTS.traits,
      blocks: personality.traits,
    },
    {
      title: PHB_LABELS.ideals,
      height: PHB_PERSONALITY_HEIGHTS.ideals,
      blocks: personality.ideals,
    },
    {
      title: PHB_LABELS.bonds,
      height: PHB_PERSONALITY_HEIGHTS.bonds,
      blocks: personality.bonds,
    },
    {
      title: PHB_LABELS.flaws,
      height: PHB_PERSONALITY_HEIGHTS.flaws,
      blocks: personality.flaws,
    },
  ];

  const groupHeight =
    PHB_PADDING * 2
    + panels.reduce((sum, panel) => sum + panel.height, 0)
    + PHB_GAP * (panels.length - 1);

  drawPhbGroup(page, { left, top: PHB_BODY_TOP, width, height: groupHeight });

  let cursor = PHB_BODY_TOP + PHB_PADDING;

  for (const panel of panels) {
    const area = drawPhbPanel(
      context,
      page,
      {
        left: left + PHB_PADDING,
        top: cursor,
        width: width - PHB_PADDING * 2,
        height: panel.height,
      },
      panel.title,
    );

    drawPhbLinedText(context, page, area, {
      paragraphs: getPhbParagraphs(panel.blocks),
    });

    cursor += panel.height + PHB_GAP;
  }

  const featuresRect = getFeaturesPanelRect();

  const featuresArea = drawPhbPanel(
    context,
    page,
    featuresRect,
    PHB_LABELS.features,
  );

  drawPhbLinedText(context, page, featuresArea, {
    paragraphs: getPhbFeatureLines(sheet).slice(0, getPhbMainFeatureCapacity()),
    isList: true,
  });
}

/**
 * Основная страница листа «как в Книге игрока»: шапка и три колонки
 * печатного листа PHB 2014.
 *
 * @param context документ в процессе сборки.
 * @param sheet лист.
 */
export function drawPhbMainPage(
  context: PdfBuildContext,
  sheet: PdfSheet,
): void {
  const page = createPdfPage(context);

  drawMainHeader(context, page, sheet);
  drawLeftColumn(context, page, sheet);
  drawCenterColumn(context, page, sheet);
  drawRightColumn(context, page, sheet);
}
