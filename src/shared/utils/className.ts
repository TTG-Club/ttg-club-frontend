import { kebabCase } from 'lodash-es';
import { getCurrentInstance, useCssModule } from 'vue';

type ModifiersRecord = Record<string, boolean | string | number>;

/**
 * Generates an array of class names according to the BEM convention
 *
 * @param blockName block name, camel-case will be converted to the kebab-case
 * @param modifiers record of modifiers in `{[key]: value}` format
 * @returns An array of generated class names: `['block-name', 'block-name--modifier']`
 */
function className(blockName: string, modifiers: ModifiersRecord): string[];
/**
 * Generates an array of class names according to the BEM convention
 *
 * @param blockName block name, camel-case will be converted to the kebab-case
 * @param elementName element name, camel-case will be converted to the kebab-case
 * @param modifiers record of modifiers in `{[key]: value}` format, camel-case of modifier names will be converted to the kebab-case
 * @returns An array of generated class names: `['block-name__element', 'block-name__element--modifier']`
 */
function className(
  blockName: string,
  elementName: string | undefined,
  modifiers?: ModifiersRecord,
): string[];
function className(blockName: string, ...args: unknown[]): string[];
function className(blockName: string, ...args: unknown[]): string[] {
  const bn = kebabCase(blockName);

  const [arg1, arg2] = args;

  // short-circuit if called as className(blockName)
  if (!arg1) return [bn];

  let elementName: string | undefined;
  let modifiers: ModifiersRecord | undefined;

  if (typeof arg1 === 'string') {
    // called as className(blockName, elementName, modifiers)
    elementName = kebabCase(arg1);
    modifiers = arg2 as ModifiersRecord;
  } else {
    // called as className(blockName, modifiers)
    modifiers = arg1 as ModifiersRecord;
  }

  const classNames: string[] = [];

  // always return the name without modifiers:
  // block-name or block-name__element-name
  const baseName = elementName ? `${bn}__${elementName}` : bn;

  classNames.push(baseName);

  if (modifiers) {
    for (const [key, value] of Object.entries(modifiers)) {
      let cn = baseName;

      const modifierName = kebabCase(key);

      if (typeof value === 'boolean') {
        // false modifier is not returned
        if (!value) continue;

        // boolean modifier:
        // block-name__element-name--modifier
        cn += `--${modifierName}`;
      } else {
        // value modifier:
        // block-name__element-name--modifier-value
        cn += `--${modifierName}-${value}`;
      }

      classNames.push(cn);
    }
  }

  return classNames;
}

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
