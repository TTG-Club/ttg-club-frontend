import type { ClassMechanicsDetail, MechanicsChoice } from './mechanics';
import type { SheetDocument, SheetSource } from './schema';

import { isEqual } from 'es-toolkit';

import { FEATURE_OPTIONS_CHOICE_PREFIX } from './constants';
import { getClassFeatureSourceUrl } from './levelUp';
import { catalogMechanicsSchema } from './mechanics';

/**
 * Выбор из вариантов умения в механике умения карточки класса.
 * @param detail - механика карточки класса или архетипа
 * @param featureId - идентификатор умения (`c33`, `a116`)
 */
function findFeatureOptionsChoice(
  detail: ClassMechanicsDetail | undefined,
  featureId: string,
): MechanicsChoice | undefined {
  const feature = detail?.traits?.features.find(
    (entry) => entry.id === featureId,
  );

  return feature?.mechanics?.choices?.find((choice) =>
    choice.key.startsWith(FEATURE_OPTIONS_CHOICE_PREFIX),
  );
}

/**
 * Источник умения с актуальным выбором из вариантов: выбор дописывается
 * или заменяется по ключу, поэтому ответы игрока сохраняются.
 * @param source - источник умения класса
 * @param choice - выбор из вариантов по карточке класса
 */
function withChoice(source: SheetSource, choice: MechanicsChoice): SheetSource {
  const base = source.mechanics ?? catalogMechanicsSchema.parse({});

  const others = (base?.choices ?? []).filter(
    (entry) => entry.key !== choice.key,
  );

  return {
    ...source,
    mechanics: base ? { ...base, choices: [...others, choice] } : null,
  };
}

/**
 * Досинхронизация выборов из вариантов умений: источники умений, созданные
 * до появления вариантов (или до их правки в мастерской), получают выбор из
 * текущей карточки класса. Возвращает новый лист или null, если менять
 * нечего.
 * @param document - лист персонажа
 * @param getDetail - механика карточки класса или архетипа по адресу
 */
export function syncFeatureOptionChoices(
  document: SheetDocument,
  getDetail: (url: string | null) => ClassMechanicsDetail | undefined,
): SheetDocument | null {
  let isChanged = false;

  const sources = document.sources.map((source) => {
    if (source.kind !== 'classFeature' || !source.classId || !source.url) {
      return source;
    }

    const sheetClass = document.classes.find(
      (candidate) => candidate.id === source.classId,
    );

    if (!sheetClass) {
      return source;
    }

    const prefix = getClassFeatureSourceUrl(sheetClass.url, '');

    if (!source.url.startsWith(prefix)) {
      return source;
    }

    const featureId = source.url.slice(prefix.length);

    const choice =
      findFeatureOptionsChoice(getDetail(sheetClass.archetypeUrl), featureId)
      ?? findFeatureOptionsChoice(getDetail(sheetClass.url), featureId);

    if (!choice) {
      return source;
    }

    const current = source.mechanics?.choices?.find(
      (entry) => entry.key === choice.key,
    );

    if (current && isEqual(current, choice)) {
      return source;
    }

    isChanged = true;

    return withChoice(source, choice);
  });

  return isChanged ? { ...document, sources } : null;
}
