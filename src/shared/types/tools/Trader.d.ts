import type { TSpellItem, TSpellLink } from '@/shared/types/character/Spells';
import type {
  TArtifactItem,
  TArtifactLink,
} from '@/shared/types/inventory/MagicItems';

export type TTraderLink = TArtifactLink & {
  spell?: TSpellLink;
  price?: Record<string, number | null>;
};

export type TTraderItem = TArtifactItem & {
  spell?: TSpellItem;
};

export type TGroupedTraderLink = TTraderLink & {
  custom?: {
    count?: number;
    price: number | null;
  };
};
