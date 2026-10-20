/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-clean-order/error'],

  rules: {
    'font-family-no-missing-generic-family-keyword': true,
    'declaration-block-no-shorthand-property-overrides': true,
    'annotation-no-unknown': true,
    'length-zero-no-unit': true,
  },

  overrides: [
    {
      files: ['**/*.(scss|css|vue)'],
      customSyntax: 'postcss-scss',
    },
    {
      files: ['**/*.(html|vue)'],
      customSyntax: 'postcss-html',
    },
  ],
};
