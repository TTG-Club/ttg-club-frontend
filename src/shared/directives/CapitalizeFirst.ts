import { upperFirst } from 'lodash-es';

import type { Directive } from 'vue';

export const CapitalizeFirst: Directive = {
  created(el) {
    // eslint-disable-next-line no-param-reassign
    el.innerText = upperFirst(el.innerText);
  },
};

export default {
  CapitalizeFirst,
};
