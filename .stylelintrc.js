/** @type {import('stylelint').Config} */
export default {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-standard-scss',
    'stylelint-config-clean-order',
  ],

  ignoreFiles: ['!(src|public)/**/*.{css,scss,vue}'],

  plugins: ['stylelint-order'],

  rules: {
    'selector-class-pattern': null,
    'alpha-value-notation': ['number'],
  },

  overrides: [
    {
      files: ['*.scss', '**/*.scss'],

      rules: {
        'at-rule-empty-line-before': null,
        'color-function-notation': ['modern', { ignore: ['with-var-inside'] }],
      },
    },
    {
      files: ['*.vue', '**/*.vue'],
      extends: [
        'stylelint-config-standard',
        'stylelint-config-standard-scss',
        'stylelint-config-standard-vue/scss',
        'stylelint-config-clean-order',
      ],
    },
  ],
};
