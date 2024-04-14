import { getCurrentInstance, useCssModule } from 'vue';

import { className, type ModifiersRecord } from '@/shared/utils/className';

/**
 * Returns a function that generates an array of class names according to the BEM convention, where block is the component name,
 * and uses the css module to retrieve the corresponding class names
 */
export const useClassName = (): {
  (elementName?: string, modifiers?: ModifiersRecord): string[];
  (modifiers: ModifiersRecord): string[];
} => {
  const blockName = getCurrentInstance()?.type.__name;

  if (!blockName) {
    throw new Error('Cannot get current instance component name');
  }

  const module = useCssModule();

  return (...args: unknown[]) =>
    className(blockName, ...args).map((cn) => module[cn]);
};
