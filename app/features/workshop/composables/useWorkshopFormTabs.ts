import type { FormError } from '@nuxt/ui';

import type { Ref } from 'vue';

import { getWorkshopFieldTab } from '../model';

/** Вкладки формы редактора. */
interface WorkshopFormTabs {
  activeTab: Ref<string>;
  openErrorTab: (errors: Array<FormError>) => Array<string>;
}

/**
 * Имена полей с ошибками.
 * @param errors - ошибки проверки формы
 */
function getErrorFieldNames(errors: Array<FormError>): Array<string> {
  return errors.flatMap((error) => (error.name ? [error.name] : []));
}

/**
 * Вкладки редактора. Поля скрытых вкладок остаются в форме, поэтому при
 * ошибке открывается вкладка с ней: иначе ошибку не видно.
 * @param fieldTabs - вкладки полей формы
 * @param defaultTab - вкладка, открытая сначала
 */
export function useWorkshopFormTabs(
  fieldTabs: Readonly<Record<string, string>>,
  defaultTab: string,
): WorkshopFormTabs {
  const activeTab = ref(defaultTab);

  /**
   * Открывает вкладку первой ошибки, если на текущей ошибок нет.
   * @param errors - ошибки проверки формы
   * @returns имена полей с ошибками: по ним раскрываются элементы списков
   */
  function openErrorTab(errors: Array<FormError>): Array<string> {
    const fieldNames = getErrorFieldNames(errors);

    const errorTabs = fieldNames.flatMap((fieldName) => {
      const tab = getWorkshopFieldTab(fieldTabs, fieldName);

      return tab ? [tab] : [];
    });

    const [firstErrorTab] = errorTabs;

    if (firstErrorTab && !errorTabs.includes(activeTab.value)) {
      activeTab.value = firstErrorTab;
    }

    return fieldNames;
  }

  return { activeTab, openErrorTab };
}
