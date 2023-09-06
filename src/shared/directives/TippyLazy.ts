import { directive } from 'vue-tippy';

import type { Directive, ObjectDirective } from 'vue';

type TippyLazyStore = {
  isMounted: boolean;
  handleMounted: (...args: any[]) => unknown;
};

const tippyDirective = directive as ObjectDirective;

const enterEvents = ['mouseenter', 'focus'];

/**
 * Директива для ленивой инициализации vue-tippy
 * стоит использовать, если замедляется рендер,
 * например, в виртуальных списках, для предотвращения лагов при скролле
 */
export const TippyLazy: Directive = {
  ...tippyDirective,
  mounted(...args) {
    const [el] = args;

    const tippyLazy: TippyLazyStore = {
      isMounted: false,
      handleMounted: (e: Event) => {
        if (!tippyLazy.isMounted) {
          tippyDirective.mounted?.(...args);
          tippyLazy.isMounted = true;

          /* Снова диспатчим событие уже для обработчиков tippy.js */
          requestAnimationFrame(() => {
            e.target?.dispatchEvent(e);
          });
        }
      }
    };

    el.tippyLazy = tippyLazy;

    enterEvents.forEach(event => {
      el.addEventListener(event, tippyLazy.handleMounted);
    });
  },
  unmounted(...args) {
    const [el] = args;

    enterEvents.forEach(event => {
      el.removeEventListener(event, el.tippyLazy?.handleMounted);
    });

    tippyDirective.unmounted?.(...args);
  }
};
