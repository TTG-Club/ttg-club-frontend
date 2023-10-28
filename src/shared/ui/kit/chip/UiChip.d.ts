export type TChipSize = 'l' | 'm' | 's' | 'xs';

export type TChipColor = 'primary' | 'secondary';

export type TChipVariant = 'round' | 'rectangle';

export interface IChipProps {
  modelValue?: boolean;
  size?: TChipSize;
  color?: TChipColor;
  variant?: TChipVariant;
  clickable?: boolean;
  button?: boolean;
  count?: number | string;
}
