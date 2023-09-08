import type { TSpellLink } from '@/shared/types/Character/Spells';
import type { TArtifactLink } from '@/shared/types/Inventory/MagicItems';

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
