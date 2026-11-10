import { LEADING_CHARACTER } from './consts';

const OPEN_BRACE = '{';
const CLOSE_BRACE = '}';

/**
 * Находит конец маркера {@...}, начиная с позиции `start`.
 *
 * Балансировка: уровень растёт только на паре «{@» (вложенный маркер) и падает
 * на любой «}». ЕДИНЫЙ источник границы маркера для всех потребителей —
 * строкового парсера и TipTap-токенайзеров редактора, чтобы они согласованно
 * определяли, где заканчивается маркер (иначе round-trip редактор↔сайт
 * расходится: текст режется/склеивается по-разному).
 *
 * @param source - Исходная строка
 * @param start - Индекс открывающей «{» маркера (по умолчанию 0)
 * @param max - Верхняя граница поиска (по умолчанию длина строки)
 * @returns Индекс сразу за закрывающей «}», либо -1, если маркер не закрыт
 */
export function findMarkerEnd(
  source: string,
  start = 0,
  max = source.length,
): number {
  let level = 0;

  for (let i = start; i < max; i++) {
    if (source[i] === OPEN_BRACE && source[i + 1] === LEADING_CHARACTER) {
      level++;
      i++;

      continue;
    }

    if (source[i] === CLOSE_BRACE) {
      level--;

      if (level === 0) {
        return i + 1;
      }
    }
  }

  return -1;
}
