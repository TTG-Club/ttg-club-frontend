export type TChipSize = 'l' | 'm' | 's' | 'xs';

export type TChipType = 'primary' | 'secondary';

export type TChipVariant = 'round' | 'rectangle';

export interface IChipProps {
  modelValue?: boolean;
  size?: TChipSize;
  type?: TChipType;
  variant?: TChipVariant;
  button?: boolean;
  badge?: boolean;
}
