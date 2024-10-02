export type TChipSize = 'lg' | 'md' | 'sm' | 'xs';

export type TChipColor = 'primary' | 'secondary';

export type TChipVariant = 'round' | 'rectangle';

export interface IChipProps {
  modelValue?: boolean;
  size?: TChipSize;
  color?: TChipColor;
  variant?: TChipVariant;
  clickable?: boolean;
  count?: number | string;
}
