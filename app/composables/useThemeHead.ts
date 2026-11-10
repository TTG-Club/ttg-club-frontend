import { CUSTOM_THEME_STYLE_KEY } from '~infrastructure/custom-theme/model';

/**
 * Ставит тему на `<html>`: класс темы и, у своей темы, тег `<style>` с её
 * переменными. Работает и на сервере — страница сразу приходит в нужных
 * цветах, без вспышки темы по умолчанию.
 */
export function useThemeHead() {
  const { htmlClass, customCss } = useTheme();

  useHead({
    htmlAttrs: {
      class: htmlClass,
    },
    style: () =>
      customCss.value
        ? [
            {
              key: CUSTOM_THEME_STYLE_KEY,
              innerHTML: customCss.value,
              tagPriority: 'critical',
            },
          ]
        : [],
  });
}
