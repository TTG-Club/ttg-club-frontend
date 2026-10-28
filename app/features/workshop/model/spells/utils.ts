import type { SpellForm } from './schemas';
import type { SpellTime, WorkshopSpell } from './types';

import { toOptionalText } from '../utils';
import {
  SPELL_DEFAULT_SCHOOL,
  SPELL_DEFAULT_TIME_NUMBER,
  SPELL_DEFAULT_TIME_UNIT,
  SPELL_SCHOOL_OPTIONS,
  SPELL_TIME_ALTERNATIVE_SEPARATOR,
  SPELL_TIME_CONDITION_SEPARATOR,
  SPELL_TIME_UNIT_OPTIONS,
} from './constants';

/**
 * Код школы по её названию из карточки.
 * @param school - «воплощение»
 */
export function getSpellSchoolValue(school: string): string {
  const normalized = school.trim().toLowerCase();

  return (
    SPELL_SCHOOL_OPTIONS.find((option) => option.detailValue === normalized)
      ?.value ?? SPELL_DEFAULT_SCHOOL
  );
}

/**
 * Код единицы времени по её названию в любой форме.
 * @param name - «минут», «бонусное действие»
 */
function findTimeUnit(name: string): string | undefined {
  const normalized = name.trim().toLowerCase();

  return SPELL_TIME_UNIT_OPTIONS.find((option) =>
    option.names.includes(normalized),
  )?.value;
}

/**
 * Разбирает время накладывания из карточки. Карточка склеивает варианты
 * через «или», а редактор хранит один — берётся первый. Неизвестный вид
 * даёт время нового заклинания.
 * @param time - «1 реакция, которую вы совершаете…»
 */
export function parseSpellTime(time: string): SpellTime {
  const fallback: SpellTime = {
    number: SPELL_DEFAULT_TIME_NUMBER,
    unit: SPELL_DEFAULT_TIME_UNIT,
    condition: '',
  };

  const [first = ''] = time.split(SPELL_TIME_ALTERNATIVE_SEPARATOR);
  const variant = first.trim();

  // «При попадании» пишется без числа
  const unitOnly = findTimeUnit(variant);

  if (unitOnly) {
    return { ...fallback, unit: unitOnly };
  }

  const spaceIndex = variant.indexOf(' ');
  const number = Number(variant.slice(0, spaceIndex));
  const rest = variant.slice(spaceIndex + 1);
  const commaIndex = rest.indexOf(SPELL_TIME_CONDITION_SEPARATOR);
  const unitName = commaIndex < 0 ? rest : rest.slice(0, commaIndex);
  const condition = commaIndex < 0 ? '' : rest.slice(commaIndex + 1).trim();
  const unit = findTimeUnit(unitName);

  if (spaceIndex < 1 || !Number.isInteger(number) || number < 1 || !unit) {
    return fallback;
  }

  return { number, unit, condition };
}

/**
 * Форма заклинания: пустая для создания или заполненная записью.
 * @param spell - запись справочника
 */
export function createSpellForm(spell?: WorkshopSpell): SpellForm {
  const time = parseSpellTime(spell?.time ?? '');

  return {
    name: spell?.name ?? '',
    englishName: spell?.englishName ?? '',
    level: spell?.level ?? 0,
    school: spell ? getSpellSchoolValue(spell.school) : SPELL_DEFAULT_SCHOOL,
    additionalType: spell?.additionalType ?? '',
    ritual: spell?.ritual ?? false,
    concentration: spell?.concentration ?? false,
    verbalComponent: spell?.verbal ?? false,
    somaticComponent: spell?.somatic ?? false,
    // Карточка не говорит, расходуется ли компонент, как и в старом SPA
    consumable: false,
    materialComponent: spell?.material ?? '',
    timeNumber: time.number,
    timeUnit: time.unit,
    timeCondition: time.condition,
    range: spell?.range ?? '',
    duration: spell?.duration ?? '',
    description: spell?.description ?? '',
    upper: spell?.upper ?? '',
  };
}

/**
 * Тело запроса сохранения: пустые необязательные поля не отправляются.
 * @param form - проверенная форма
 * @param source - аббревиатура книги-источника
 */
export function getSpellPayload(
  form: SpellForm,
  source: string | undefined,
): Record<string, unknown> {
  return {
    ...form,
    source: toOptionalText(source),
    additionalType: toOptionalText(form.additionalType),
    materialComponent: toOptionalText(form.materialComponent),
    timeCondition: toOptionalText(form.timeCondition),
    upper: toOptionalText(form.upper),
  };
}
