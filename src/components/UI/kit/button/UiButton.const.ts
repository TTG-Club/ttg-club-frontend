import type { TButtonGroupContext } from '@/components/UI/kit/button/UiButton.d';

import type { InjectionKey } from 'vue';

export const buttonGroupContextKey: InjectionKey<
  TButtonGroupContext | undefined
> = Symbol('buttonGroupContextKey');
