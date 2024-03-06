import { TArtifactLink } from '@/shared/types/inventory/MagicItems';

export type CrListItem = {
  name: string;
  value: number;
};

export type TGroupedTreasureLink = {
  arts: TArtifactLink[];
  coins: Record<string, number | null>;
  gems: TArtifactLink[];
  magicItems: TArtifactLink[];
  trinkets: TArtifactLink[];
};
