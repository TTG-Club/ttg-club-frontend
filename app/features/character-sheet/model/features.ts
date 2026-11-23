import type { SheetSource } from './schema';
import type { FeatureOrigin } from './types';

import { FEATURE_ORIGINS } from './constants';

/**
 * Вид источника особенности по виду записи механики: раса и её
 * особенности, умения и варианты класса, предыстория, черты и увеличения
 * характеристик.
 * @param kind - вид записи механики
 */
export function getSourceFeatureOrigin(
  kind: SheetSource['kind'],
): FeatureOrigin {
  switch (kind) {
    case 'race':
    case 'subrace':
    case 'raceFeature': {
      return 'race';
    }
    case 'background': {
      return 'background';
    }
    case 'feat':
    case 'asi': {
      return 'feat';
    }
    default: {
      return 'class';
    }
  }
}

/**
 * Порядок группы источника в списке особенностей.
 * @param origin - вид источника
 */
export function getFeatureOriginOrder(origin: FeatureOrigin): number {
  return FEATURE_ORIGINS.indexOf(origin);
}
