import { ref } from 'vue';
import type { Maybe } from '@/types/Shared/Utility.types';

export type RefFunction<R> = (element: R) => void;

export const useReference = <R>() => {
  const reference = ref<Maybe<R>>();

  const setReference = (element: R) => {
    reference.value = element;
  };

  return [reference, setReference] as const;
};
