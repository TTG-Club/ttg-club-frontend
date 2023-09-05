import type { TButtonGroupContext } from '@/shared/ui/kit/button/UiButton';

import type { InjectionKey } from 'vue';

export const buttonGroupContextKey: InjectionKey<
  TButtonGroupContext | undefined
> = Symbol('buttonGroupContextKey');
