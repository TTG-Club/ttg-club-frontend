export default {
  extends: ['stylelint-config-standard', 'stylelint-config-clean-order'],

  plugins: ['stylelint-order'],

  rules: {
    'selector-class-pattern': null,
  },

  overrides: [
    {
      files: ['*.scss', '**/*.scss'],
      extends: [
        'stylelint-config-standard-scss',
        'stylelint-config-clean-order',
      ],
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
