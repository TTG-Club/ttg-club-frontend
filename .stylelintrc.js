/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-clean-order'],

  ignoreFiles: ['!(src|public)/**'],

  plugins: ['stylelint-order'],

  rules: {
    'font-family-no-missing-generic-family-keyword': true,
    'declaration-block-no-shorthand-property-overrides': true,
    'annotation-no-unknown': true,
    'length-zero-no-unit': true,
  },

  overrides: [
    {
      files: ['**/*.(scss|css|html|vue)'],
      customSyntax: 'postcss-scss',
    },
    {
      files: ['**/*.(html|vue)'],
      customSyntax: 'postcss-html',
    },
  ],
};
