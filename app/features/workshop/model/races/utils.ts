import type { RaceForm } from './schemas';
import type { RaceAbility, RaceFeature, WorkshopRace } from './types';

import { toOptionalNumber, toOptionalText } from '../utils';
import { RACE_DEFAULT } from './constants';

/** Новый бонус характеристики, как в старом SPA. */
export function createRaceAbility(): RaceAbility {
  return { ability: RACE_DEFAULT.ability, bonus: RACE_DEFAULT.bonus };
}

/** Новая особенность расы. */
export function createRaceFeature(): RaceFeature {
  return {
    name: '',
    englishName: '',
    description: '',
    feature: true,
    replaceFeatureId: null,
  };
}

/**
 * Форма расы: значения старого SPA для создания или заполненная записью.
 * @param race - запись справочника
 */
export function createRaceForm(race?: WorkshopRace): RaceForm {
  return {
    name: race?.name ?? '',
    englishName: race?.englishName ?? '',
    altName: race?.altName ?? '',
    parentId: race?.parentId || undefined,
    size: race?.size ?? RACE_DEFAULT.size,
    type: race?.type ?? RACE_DEFAULT.type,
    minAge: race?.minAge ?? null,
    maxAge: race?.maxAge ?? null,
    speed: race?.speed ?? RACE_DEFAULT.speed,
    darkvision: race?.darkvision ?? null,
    fly: race?.fly ?? null,
    climb: race?.climb ?? null,
    swim: race?.swim ?? null,
    origin: race?.origin ?? false,
    view: race?.view ?? true,
    icon: race?.icon ?? '',
    page: race?.page ?? null,
    abilities: (race?.abilities ?? []).map((ability) => ({ ...ability })),
    features: (race?.features ?? []).map((feature) => ({ ...feature })),
    description: race?.description ?? '',
  };
}

/**
 * Тело запроса сохранения: пустые и нулевые необязательные поля не
 * отправляются, иначе карточка покажет скорость полёта 0.
 * @param form - проверенная форма
 * @param source - аббревиатура книги-источника
 */
export function getRacePayload(
  form: RaceForm,
  source: string | undefined,
): Record<string, unknown> {
  return {
    ...form,
    source: toOptionalText(source),
    altName: toOptionalText(form.altName),
    parentId: form.parentId ? Number(form.parentId) : undefined,
    minAge: toOptionalNumber(form.minAge),
    maxAge: toOptionalNumber(form.maxAge),
    darkvision: toOptionalNumber(form.darkvision),
    fly: toOptionalNumber(form.fly),
    climb: toOptionalNumber(form.climb),
    swim: toOptionalNumber(form.swim),
    origin: form.origin || undefined,
    icon: toOptionalText(form.icon),
    page: toOptionalNumber(form.page),
    abilities: form.abilities.map((ability) => ({
      ability: ability.ability,
      bonus: ability.bonus ?? undefined,
    })),
    features: form.features.map((feature) => ({
      id: feature.id,
      name: feature.name.trim(),
      englishName: toOptionalText(feature.englishName),
      description: feature.description.trim(),
      feature: feature.feature,
      replaceFeatureId: toOptionalNumber(feature.replaceFeatureId),
    })),
  };
}

/**
 * HTML-поля формы расы с именами для показа ошибок.
 * @param form - состояние формы
 */
export function getRaceHtmlFields(
  form: Partial<RaceForm>,
): Record<string, string> {
  return {
    description: form.description ?? '',
    ...Object.fromEntries(
      (form.features ?? []).map((feature, index) => [
        `features.${index}.description`,
        feature.description,
      ]),
    ),
  };
}
