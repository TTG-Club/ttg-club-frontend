/**
 * Проверка арифметической формулы эффекта без вычисления: числа, `+ - * /`,
 * скобки, @-переменные и функции `min`, `max`, `floor`, `ceil`, `abs`.
 *
 * Нужна полю «Сл формулой» у срабатываний урона (`max(10, floor(@damage / 2))`):
 * формулу с ошибкой VTTG молча заменяет числом Сл, и автор должен увидеть
 * ошибку ещё в форме. Значения переменных не проверяются — контекста нет.
 *
 * Зеркало синтаксиса `validateFormula` из
 * dnd5-test-migrate/src/engine/formulaParser.ts: те же токены, приоритеты и
 * сообщения об ошибках.
 */

import { EFFECT_FORMULA_ERRORS } from './constants';

/** Результат проверки формулы. */
export interface FormulaValidationResult {
  /** Годна ли формула. */
  valid: boolean;
  /** Описание ошибки, если формула негодна. */
  error?: string;
}

/** Вид токена формулы. */
type FormulaTokenType =
  | 'number'
  | 'operator'
  | 'leftParen'
  | 'rightParen'
  | 'variable'
  | 'function'
  | 'comma';

/** Токен формулы. */
interface FormulaToken {
  type: FormulaTokenType;
  value: string;
}

/** Ошибка разбора формулы. */
class FormulaError extends Error {
  /**
   * Создаёт ошибку разбора с сообщением, которое увидит автор формулы.
   *
   * @param message описание ошибки для автора.
   */
  constructor(message: string) {
    super(message);
    this.name = 'FormulaError';
  }
}

/** Поддерживаемые функции. */
const SUPPORTED_FUNCTIONS: ReadonlySet<string> = new Set([
  'min',
  'max',
  'floor',
  'ceil',
  'abs',
]);

/** Приоритет операторов. */
const OPERATOR_PRECEDENCE: Record<string, number> = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2,
};

/** Одиночные символы формулы и их токены. */
const PUNCTUATION_TOKENS: Record<string, FormulaTokenType> = {
  '(': 'leftParen',
  ')': 'rightParen',
  ',': 'comma',
};

/** Буква латиницы. */
const ALPHA_PATTERN = /^[a-z]$/i;

/** Буква латиницы, цифра или подчёркивание. */
const ALPHANUMERIC_PATTERN = /^\w$/;

/** Цифра. */
const DIGIT_PATTERN = /^\d$/;

/**
 * Разбивает формулу на токены.
 *
 * @param formula строка формулы.
 * @returns токены.
 * @throws FormulaError при недопустимом символе.
 */
function tokenize(formula: string): FormulaToken[] {
  const tokens: FormulaToken[] = [];

  let position = 0;

  while (position < formula.length) {
    const character = formula.charAt(position);

    if (character === ' ' || character === '\t') {
      position++;

      continue;
    }

    if (DIGIT_PATTERN.test(character)) {
      let numberText = '';

      while (
        position < formula.length
        && (DIGIT_PATTERN.test(formula.charAt(position))
          || formula.charAt(position) === '.')
      ) {
        numberText += formula.charAt(position);
        position++;
      }

      tokens.push({ type: 'number', value: numberText });

      continue;
    }

    if (character === '@') {
      let variablePath = '';

      position++;

      while (
        position < formula.length
        && (ALPHANUMERIC_PATTERN.test(formula.charAt(position))
          || formula.charAt(position) === '.')
      ) {
        variablePath += formula.charAt(position);
        position++;
      }

      if (variablePath.length === 0) {
        throw new FormulaError(EFFECT_FORMULA_ERRORS.missingVariable(position));
      }

      tokens.push({ type: 'variable', value: variablePath });

      continue;
    }

    if (
      character === '+'
      || character === '-'
      || character === '*'
      || character === '/'
    ) {
      tokens.push({ type: 'operator', value: character });
      position++;

      continue;
    }

    const punctuationType = PUNCTUATION_TOKENS[character];

    if (punctuationType) {
      tokens.push({ type: punctuationType, value: character });
      position++;

      continue;
    }

    if (ALPHA_PATTERN.test(character)) {
      let identifier = '';

      while (
        position < formula.length
        && ALPHANUMERIC_PATTERN.test(formula.charAt(position))
      ) {
        identifier += formula.charAt(position);
        position++;
      }

      if (!SUPPORTED_FUNCTIONS.has(identifier)) {
        throw new FormulaError(
          EFFECT_FORMULA_ERRORS.unknownIdentifier(identifier),
        );
      }

      tokens.push({ type: 'function', value: identifier });

      continue;
    }

    throw new FormulaError(
      EFFECT_FORMULA_ERRORS.unexpectedChar(character, position),
    );
  }

  return tokens;
}

/**
 * Проверяет порядок токенов рекурсивным спуском с приоритетами операторов.
 * Ничего не вычисляет: годная формула проходит молча, негодная — бросает.
 *
 * @param tokens токены формулы.
 * @throws FormulaError при синтаксической ошибке.
 */
function assertFormulaSyntax(tokens: readonly FormulaToken[]): void {
  let position = 0;

  /**
   * Разбирает выражение не ниже приоритета.
   *
   * @param minPrecedence минимальный приоритет уровня.
   */
  function parseExpression(minPrecedence: number): void {
    parsePrimary();

    for (
      let token = tokens[position];
      token?.type === 'operator';
      token = tokens[position]
    ) {
      const precedence = OPERATOR_PRECEDENCE[token.value] ?? 0;

      if (precedence < minPrecedence) {
        break;
      }

      position++;
      parseExpression(precedence + 1);
    }
  }

  /** Разбирает число, переменную, функцию, скобки или унарный знак. */
  function parsePrimary(): void {
    const token = tokens[position];

    if (!token) {
      throw new FormulaError(EFFECT_FORMULA_ERRORS.unexpectedEnd);
    }

    if (token.type === 'number' || token.type === 'variable') {
      position++;

      return;
    }

    if (token.type === 'function') {
      position++;

      if (tokens[position]?.type !== 'leftParen') {
        throw new FormulaError(
          EFFECT_FORMULA_ERRORS.missingFunctionParen(token.value),
        );
      }

      position++;

      if (tokens[position] && tokens[position]?.type !== 'rightParen') {
        parseExpression(0);

        while (tokens[position]?.type === 'comma') {
          position++;
          parseExpression(0);
        }
      }

      if (tokens[position]?.type !== 'rightParen') {
        throw new FormulaError(
          EFFECT_FORMULA_ERRORS.unclosedFunction(token.value),
        );
      }

      position++;

      return;
    }

    if (token.type === 'leftParen') {
      position++;
      parseExpression(0);

      if (tokens[position]?.type !== 'rightParen') {
        throw new FormulaError(EFFECT_FORMULA_ERRORS.unclosedParen);
      }

      position++;

      return;
    }

    if (
      token.type === 'operator'
      && (token.value === '-' || token.value === '+')
    ) {
      position++;
      parsePrimary();

      return;
    }

    throw new FormulaError(EFFECT_FORMULA_ERRORS.unexpectedToken(token.value));
  }

  parseExpression(0);

  const extraToken = tokens[position];

  if (extraToken) {
    throw new FormulaError(EFFECT_FORMULA_ERRORS.extraToken(extraToken.value));
  }
}

/**
 * Проверяет синтаксис формулы.
 *
 * @param formula строка формулы.
 * @returns результат проверки с описанием ошибки.
 */
export function validateFormula(formula: string): FormulaValidationResult {
  const trimmed = formula.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: EFFECT_FORMULA_ERRORS.empty };
  }

  if (!Number.isNaN(Number(trimmed))) {
    return { valid: true };
  }

  try {
    assertFormulaSyntax(tokenize(trimmed));

    return { valid: true };
  } catch (parseError) {
    return {
      valid: false,
      error:
        parseError instanceof FormulaError
          ? parseError.message
          : EFFECT_FORMULA_ERRORS.invalid,
    };
  }
}
