/**
 * Внутренние помощники модели эффектов. В баррель модели не попадают: на
 * новом сайте это общие авто-импорты (`createEntityId`, `getPlural`), а на
 * старом их нет, и выносить их в общий код ради одной фичи не стоит.
 */

/**
 * Собирает уникальный ключ записи формы — эффекта, срабатывания и всего, что
 * живёт в JSON и должно пережить переименование.
 *
 * Через `crypto.randomUUID`, а когда его нет — временем и случайным хвостом:
 * метод требует защищённого контекста, и по обычному http его может не
 * оказаться.
 *
 * @param prefix приставка ключа: по ней в данных видно, чей это ключ.
 * @returns ключ вида `effect-<uuid>`.
 */
export function createEntityId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Подбирает форму слова под число (1 раунд, 2 раунда, 5 раундов).
 *
 * @param count число перед словом.
 * @param forms формы слова для чисел 1, 2 и 5.
 * @returns подходящая форма слова.
 */
export function getPlural(
  count: number,
  forms: [string, string, string],
): string {
  const rule = new Intl.PluralRules('ru-RU').select(Math.abs(count));

  const formsByRule: Record<Intl.LDMLPluralRule, string> = {
    zero: forms[2],
    one: forms[0],
    two: forms[1],
    few: forms[1],
    many: forms[2],
    other: forms[1],
  };

  return formsByRule[rule];
}
