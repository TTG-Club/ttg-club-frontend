import upperFirst from 'lodash/upperFirst';

// eslint-disable-next-line import/prefer-default-export
export const CapitalizeFirst = {
    created(el) {
        // eslint-disable-next-line no-param-reassign
        el.innerText = upperFirst(el.innerText);
    }
};
