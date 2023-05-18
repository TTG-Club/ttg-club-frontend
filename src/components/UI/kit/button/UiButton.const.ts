import type { InjectionKey } from 'vue';
import type { TButtonGroupContext } from '@/components/UI/kit/button/UiButton.types';

export const buttonGroupContextKey: InjectionKey<TButtonGroupContext> = Symbol('buttonGroupContextKey');
