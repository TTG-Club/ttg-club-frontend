import {
  EFFECT_DAMAGE_FORMULA_DICE_SYMBOL,
  EFFECT_DAMAGE_FORMULA_SEPARATOR,
  EFFECT_DAMAGE_FORMULA_TAG_PREFIX,
} from './constants';

/**
 * Помощники ввода формулы урона эффекта — перенос нужной эффектам части
 * общего поля формулы урона нового сайта (`~ui/damage-formula`).
 */

/** Формула после вставки и новая позиция курсора в ней. */
export interface EffectDamageFormulaInsertion {
  formula: string;
  cursor: number;
}

/**
 * Возвращает шаблон поиска кости указанного размера в формуле.
 *
 * @param diceValue размер кости.
 * @returns регулярное выражение с захватом количества.
 */
function getEffectDamageFormulaDicePattern(diceValue: number): RegExp {
  return new RegExp(
    `(^|[^\d])([1-9]\d*)?${EFFECT_DAMAGE_FORMULA_DICE_SYMBOL}${diceValue}(?!\d)`,
  );
}

/**
 * Добавляет кость в формулу или увеличивает количество уже указанной кости
 * того же размера (`1к6` → `2к6`).
 *
 * @param formula текущая формула.
 * @param diceValue размер кости.
 * @returns формула с добавленной или наращённой костью.
 */
export function incrementEffectDamageFormulaDice(
  formula: string,
  diceValue: number,
): string {
  const dicePattern = getEffectDamageFormulaDicePattern(diceValue);
  const diceMatch = dicePattern.exec(formula);

  if (!diceMatch) {
    return formula
      ? `${formula}${EFFECT_DAMAGE_FORMULA_SEPARATOR}1${EFFECT_DAMAGE_FORMULA_DICE_SYMBOL}${diceValue}`
      : `1${EFFECT_DAMAGE_FORMULA_DICE_SYMBOL}${diceValue}`;
  }

  const diceCount = diceMatch[2] ? Number(diceMatch[2]) : 1;

  return formula.replace(
    dicePattern,
    `${diceMatch[1]}${diceCount + 1}${EFFECT_DAMAGE_FORMULA_DICE_SYMBOL}${diceValue}`,
  );
}

/**
 * Вставляет текст в формулу на место выделения (или позицию курсора) и
 * сообщает, куда после этого встанет курсор. Вставка по курсору, а не в конец:
 * тип урона и условие относятся к своему слагаемому.
 *
 * @param formula текущая формула.
 * @param text вставляемый текст.
 * @param selectionStart начало выделения (позиция курсора).
 * @param selectionEnd конец выделения; равен началу, если выделения нет.
 * @returns новая формула и позиция курсора после вставленного текста.
 */
export function insertIntoEffectDamageFormula(
  formula: string,
  text: string,
  selectionStart: number,
  selectionEnd: number,
): EffectDamageFormulaInsertion {
  const start = Math.min(Math.max(selectionStart, 0), formula.length);
  const end = Math.min(Math.max(selectionEnd, start), formula.length);

  return {
    formula: `${formula.slice(0, start)}${text}${formula.slice(end)}`,
    cursor: start + text.length,
  };
}

/**
 * Собирает тег формулы: теги прилипают к своему слагаемому без разделителя
 * (`8к6@dmg.fire`).
 *
 * @param tag тег без приставки `@`.
 * @returns тег с приставкой.
 */
export function buildEffectDamageFormulaTag(tag: string): string {
  return `${EFFECT_DAMAGE_FORMULA_TAG_PREFIX}${tag}`;
}
