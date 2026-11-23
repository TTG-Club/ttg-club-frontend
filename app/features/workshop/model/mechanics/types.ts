import type { ActiveEffect } from '~active-effects/model';

import type { MechanicsForm } from './schemas';

/** Механика и активные эффекты записи, как их правит форма. */
export interface WorkshopMechanicsFields {
  mechanics: MechanicsForm;
  activeEffects: Array<ActiveEffect>;
}
