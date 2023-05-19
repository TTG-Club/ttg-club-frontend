/**
 * Получение модификатора значения характеристики.
 *
 * @param { number } ability - значение характеристики.
 * @return { number } - модификатор характеристики.
 */
export const getModifier = (ability: number) => Math.floor((ability - 10) / 2);

/**
 * Получение значения без знака.
 *
 * @param { number } ability - значение характеристики.
 * @return { number } - модификатор характеристики.
 */
export const getABSModifier = (ability: number) => Math.abs(getModifier(ability));

/**
 * Получение знака перед модификатором.
 *
 * @param { number } ability - значение характеристики.
 * @return { string } - модификатор характеристики.
 */
export const getSign = (ability: number) => (Math.sign(getModifier(ability)) > -1 ? '+' : '−');

/**
 * Получение модификатора со знаком.
 *
 * @param { number } ability - значение характеристики.
 * @return { string } - модификатор характеристики.
 */
export const getFormattedModifier = (ability: number) => (`${ getSign(ability) }${ getABSModifier(ability) }`);

/**
 * Получение формулы
 *
 * @param { number } ability - значение характеристики.
 * @return { string } - формула броска характеристики.
 */
export const getFormula = (ability: number) => (`1к20${ getSign(ability) }${ getABSModifier(ability) }`);
