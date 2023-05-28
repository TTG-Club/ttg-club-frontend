/**
 * Получение строки с перечислением из массива строк.
 *
 * @param {string[]} strings
 * @return {string}
 */
export const getIterableString = (strings: string[]) => {
  let string = '';

  for (let i = 0; i < strings.length; i++) {
    if (!i) {
      string += strings[i];

      continue;
    }

    string += strings[i].indexOf(',') > -1 ? '; ' : ', ';
    string += strings[i];
  }

  return string;
};

/**
 * Получение правильного окончания слова в зависимости от числа перед ним (пример: 1 день, 2 дня, 5 дней).
 *
 * @param {number} number - число перед словом с окончанием.
 * @param {string[]} strings - варианты окончаний слов (обычно я проверяю с числами 1, 2, 5).
 *
 * @return {string}
 */
export const getPlural = (number: number, strings: string[]) => {
  const num = Math.abs(number);

  if (Number.isInteger(num)) {
    const cases = [
      2,
      0,
      1,
      1,
      1,
      2
    ];

    return strings[(number % 100 > 4 && number % 100 < 20)
      ? 2
      : cases[(number % 10 < 5)
        ? number % 10
        : 5]];
  }

  return strings[1];
};
