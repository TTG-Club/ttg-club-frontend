import type { TArtifactLink } from '@/types/Inventory/MagicItems.types';
import type { TSpellLink } from '@/types/Character/Spells.types';

export type TTraderLink = TArtifactLink & {
  spell?: TSpellLink;
  price?: Record<string, number | null>;
};

export type TGroupedTraderLink = TTraderLink & {
  custom?: {
    count?: number;
    price: number | null;
  }
};
