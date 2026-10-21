import { createDiscreteApi, dateRuRU, ruRU } from 'naive-ui';

import { themeOverrides } from '@/shared/config';

export const useDiscreteApi = () => {
  const { message, loadingBar, modal, dialog, notification } =
    createDiscreteApi(
      ['modal', 'message', 'dialog', 'notification', 'loadingBar'],
      {
        configProviderProps: {
          themeOverrides: unref(themeOverrides),
          locale: ruRU,
          dateLocale: dateRuRU,
        },
      },
    );

  return { message, loadingBar, modal, dialog, notification };
};
