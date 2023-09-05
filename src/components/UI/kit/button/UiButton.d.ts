export type TButtonType = 'default' | 'secondary' | 'outline' | 'text';

export type TButtonSize = 'sm' | 'md' | 'lg';

export type TButtonColor =
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'text';

export type TButtonNativeType = 'button' | 'submit' | 'reset';

export type TButtonIconPosition = 'left' | 'right';

export interface ISharedButtonProps {
  size?: TButtonSize;
  color?: TButtonColor;
  nativeType?: TButtonNativeType;
  disabled?: boolean;
  fullWidth?: boolean;
}

export type TButtonGroupContext = Partial<
  Omit<ISharedButtonProps, 'fullWidth'> & {
    type: TButtonType;
  }
>;
