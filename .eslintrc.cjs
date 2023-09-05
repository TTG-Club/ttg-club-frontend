require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  ignorePatterns: ['**/public_html/*', '**/dist/*', '**/node_modules/*'],
  extends: [
    'plugin:vue/vue3-recommended',
    '@vue/airbnb',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier'
  ],
  plugins: ['@typescript-eslint'],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    ecmaVersion: 'latest',
    ecmaFeatures: { jsx: true }
  },
  rules: {
    'prettier/prettier': ['error'],
    'no-console':
      process.env.NODE_ENV === 'production'
        ? ['error', { allow: ['warn', 'error'] }]
        : ['warn', { allow: ['warn', 'error'] }],
    'no-underscore-dangle': 'off',
    'no-use-before-define': 'off',
    'no-debugger': 'error',
    'no-alert': ['error'],
    'consistent-return': [1],
    'import/extensions': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/no-unresolved': 'off',
    'import/no-webpack-loader-syntax': 'off',
    'import/prefer-default-export': 'off',
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        'warnOnUnassignedImports': true,
        'alphabetize': {
          order: 'asc',
          caseInsensitive: true
        },
        'groups': [
          'builtin',
          'external',
          'internal',
          'object',
          'parent',
          'sibling',
          'index',
          'type'
        ],
        'pathGroups': [
          { pattern: '@/app/**', group: 'parent', position: 'before' },
          { pattern: '@/processes/**', group: 'parent', position: 'before' },
          { pattern: '@/pages/**', group: 'parent', position: 'before' },
          { pattern: '@/widgets/**', group: 'parent', position: 'before' },
          { pattern: '@/features/**', group: 'parent', position: 'before' },
          { pattern: '@/entities/**', group: 'parent', position: 'before' },
          { pattern: '@/shared/**', group: 'parent', position: 'before' },
          { pattern: '@/services/**', group: 'parent', position: 'before' },
          { pattern: '@/utils/**', group: 'parent', position: 'before' },
          { pattern: '@/helpers/**', group: 'parent', position: 'before' },
          { pattern: '@/stores/**', group: 'parent', position: 'before' },
          { pattern: '@/layouts/**', group: 'parent', position: 'before' },
          { pattern: '@/components/**', group: 'parent', position: 'before' },
          { pattern: '*/types/**', group: 'type', position: 'after' }
        ]
      }
    ],
    'no-continue': 'off',
    'no-await-in-loop': 'off',
    'no-nested-ternary': [1],
    'no-return-assign': [1],
    'no-bitwise': 'off',
    'no-plusplus': 'off',
    'no-restricted-syntax': [
      2,
      'ForInStatement',
      'LabeledStatement',
      'WithStatement'
    ],
    'no-param-reassign': [
      'error',
      { props: true, ignorePropertyModificationsFor: ['state'] }
    ],
    'dot-notation': ['error'],
    'require-await': ['error'],
    'spaced-comment': ['error', 'always'],
    'camelcase': ['error'],
    'line-comment-position': ['error', { position: 'above' }],
    'lines-between-class-members': [
      'error',
      'always',
      { exceptAfterSingleLine: false }
    ],
    'padding-line-between-statements': [
      'error',
      {
        blankLine: 'always',
        prev: [
          'block-like',
          'break',
          'class',
          'const',
          'debugger',
          'directive',
          'export',
          'throw',
          'try',
          'function',
          'import'
        ],
        next: '*'
      },
      {
        blankLine: 'always',
        prev: '*',
        next: [
          'block-like',
          'break',
          'class',
          'const',
          'continue',
          'debugger',
          'directive',
          'return',
          'throw',
          'try',
          'export',
          'function',
          'import'
        ]
      },
      { blankLine: 'always', prev: 'block', next: 'block' },
      {
        blankLine: 'always',
        prev: '*',
        next: [
          'multiline-const',
          'multiline-expression',
          'multiline-let',
          'multiline-var'
        ]
      },
      { blankLine: 'never', prev: 'break', next: 'case' },
      { blankLine: 'never', prev: 'break', next: 'default' },
      { blankLine: 'any', prev: 'singleline-const', next: 'singleline-const' },
      { blankLine: 'any', prev: 'singleline-let', next: 'singleline-let' },
      { blankLine: 'any', prev: 'singleline-var', next: 'singleline-var' },
      { blankLine: 'any', prev: 'import', next: 'import' }
    ],
    'class-methods-use-this': ['error', { enforceForClassFields: false }],

    // Vue.js
    'vue/match-component-file-name': [
      'error',
      { extensions: ['jsx', 'js', 'tsx', 'ts', 'vue'], shouldMatchCase: true }
    ],
    'vue/component-options-name-casing': ['error', 'PascalCase'],
    'vue/component-name-in-template-casing': [
      'error',
      'kebab-case',
      { registeredComponentsOnly: true, ignores: [] }
    ],
    'vue/component-api-style': [
      'error',
      ['script-setup', 'composition', 'options']
    ],
    'vue/block-lang': ['off'],
    'vue/require-explicit-emits': 'off',
    'vue/padding-line-between-tags': [
      'error',
      [{ blankLine: 'always', prev: '*', next: '*' }]
    ],
    'vue/no-setup-props-destructure': 'off',
    'vue/script-setup-uses-vars': 'error',
    'vue/valid-v-slot': 'off',

    // Vue.js Accessibility
    'vuejs-accessibility/anchor-has-content': 'off',
    'vuejs-accessibility/click-events-have-key-events': 'off',
    'vuejs-accessibility/mouse-events-have-key-events': 'off',
    'vuejs-accessibility/label-has-for': 'off',
    'vuejs-accessibility/no-autofocus': 'off',

    // Typescript
    'no-shadow': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-shadow': ['error'],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-use-before-define': [
      'error',
      { typedefs: false, enums: false }
    ]
  }
};
