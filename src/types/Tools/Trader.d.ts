import type { TSpellLink } from '@/types/Character/Spells.d';
import type { TArtifactLink } from '@/types/Inventory/MagicItems.d';

export type TTraderLink = TArtifactLink & {
  spell?: TSpellLink;
  price?: Record<string, number | null>;
};

export type TGroupedTraderLink = TTraderLink & {
  custom?: {
    count?: number;
    price: number | null;
  };
};
