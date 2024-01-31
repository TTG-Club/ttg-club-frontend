require('@rushstack/eslint-patch/modern-module-resolution');

const isProd = process.env.NODE_ENV === 'production';

const boundaries = ['shared', 'features', 'layouts', 'pages', 'app'];

module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  ignorePatterns: ['!(src|.storybook|public)/**'],
  extends: [
    'plugin:vue/vue3-recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:boundaries/recommended',
    '@vue/airbnb',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier',
  ],
  plugins: ['@typescript-eslint', 'boundaries'],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    ecmaVersion: 'latest',
    ecmaFeatures: { jsx: true, modules: true },
  },
  settings: {
    'import/resolver': {
      typescript: {
        directory: '.',
        alwaysTryTypes: true,
        project: 'tsconfig.json',
      },
      node: {
        paths: 'src',
      },
    },
    'boundaries/elements': boundaries.map(name => ({
      pattern: `${name}/*`,
      type: name,
    })),
    'boundaries/include': ['src/**/*'],
    'boundaries/ignore': ['**/*.test.*', '**/*.spec.*'],
  },
  rules: {
    'prettier/prettier': ['error'],
    'no-debugger': isProd ? 'error' : 'warn',
    'no-console': isProd
      ? ['error', { allow: ['warn', 'error'] }]
      : ['warn', { allow: ['warn', 'error'] }],
    'no-underscore-dangle': 'off',
    'no-use-before-define': 'off',
    'no-alert': ['error'],
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1, maxBOF: 1 }],
    'consistent-return': ['warn'],
    'import/extensions': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/no-unresolved': 'off',
    'import/no-webpack-loader-syntax': 'off',
    'import/prefer-default-export': 'off',
    'import/export': ['error'],
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        'warnOnUnassignedImports': false,
        'pathGroupsExcludedImportTypes': ['builtin'],
        'alphabetize': {
          order: 'asc',
          orderImportKind: 'asc',
          caseInsensitive: true,
        },
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'unknown',
          'type',
          'object',
        ],
        'pathGroups': boundaries.map(name => ({
          pattern: `@/${name}/**`,
          group: 'internal',
          position: 'after',
        })),
      },
    ],
    'import/no-cycle': ['error', { maxDepth: 1 }],
    'boundaries/element-types': [
      'warn', // TODO: Это будет 'error'.
      {
        default: 'disallow',
        // eslint-disable-next-line no-template-curly-in-string
        message: '${file.type} is not allowed to import ${dependency.type}',
        rules: boundaries.map((name, index) => ({
          from: name,
          allow: boundaries.slice(0, index + 1),
        })),
      },
    ],
    'no-continue': 'off',
    'no-await-in-loop': 'off',
    'no-nested-ternary': ['warn'],
    'no-return-assign': ['warn'],
    'no-bitwise': 'off',
    'no-plusplus': 'off',
    'no-restricted-syntax': [
      'error',
      'ForInStatement',
      'LabeledStatement',
      'WithStatement',
    ],
    'no-unused-vars': 'off',
    'no-param-reassign': [
      'error',
      { props: true, ignorePropertyModificationsFor: ['state'] },
    ],
    'dot-notation': ['error'],
    'require-await': ['error'],
    'spaced-comment': ['error', 'always'],
    'camelcase': ['error'],
    'guard-for-in': ['error'],
    'default-param-last': ['error'],
    'lines-between-class-members': [
      'error',
      'always',
      { exceptAfterSingleLine: false },
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
          'import',
        ],
        next: '*',
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
          'import',
        ],
      },
      { blankLine: 'always', prev: 'block', next: 'block' },
      {
        blankLine: 'always',
        prev: '*',
        next: [
          'multiline-const',
          'multiline-expression',
          'multiline-let',
          'multiline-var',
        ],
      },
      { blankLine: 'never', prev: 'break', next: 'case' },
      { blankLine: 'never', prev: 'break', next: 'default' },
      { blankLine: 'any', prev: 'singleline-const', next: 'singleline-const' },
      { blankLine: 'any', prev: 'singleline-let', next: 'singleline-let' },
      { blankLine: 'any', prev: 'singleline-var', next: 'singleline-var' },
      { blankLine: 'any', prev: 'import', next: 'import' },
    ],
    'class-methods-use-this': ['error', { enforceForClassFields: false }],

    // Vue.js
    'vue/match-component-file-name': [
      'error',
      { extensions: ['jsx', 'js', 'tsx', 'ts', 'vue'], shouldMatchCase: true },
    ],
    'vue/component-options-name-casing': ['error', 'PascalCase'],
    'vue/component-name-in-template-casing': [
      'error',
      'kebab-case',
      { registeredComponentsOnly: true, ignores: [] },
    ],
    'vue/component-api-style': ['warn', ['script-setup']],
    'vue/block-lang': [
      'warn',
      {
        script: {
          lang: 'ts',
        },
      },
    ],
    'vue/require-explicit-emits': 'off', // TODO: 'error'
    'vue/padding-line-between-tags': [
      'error',
      [{ blankLine: 'always', prev: '*', next: '*' }],
    ],
    'vue/valid-v-slot': 'off',
    'vue/html-self-closing': [
      'error',
      {
        html: {
          void: 'any',
          normal: 'always',
          component: 'always',
        },
        svg: 'always',
        math: 'always',
      },
    ],
    'vue/block-order': [
      'error',
      {
        order: ['script', 'template', 'style'],
      },
    ],
    'vue/define-props-declaration': ['warn', 'type-based'], // TODO: 'error'
    'vue/define-emits-declaration': ['warn', 'type-based'], // TODO: 'error'
    'vue/no-ref-object-reactivity-loss': ['warn'],
    'vue/match-component-import-name': ['error'],
    'vue/no-empty-component-block': ['error'],
    'vue/no-multiple-objects-in-class': ['error'],
    'vue/no-static-inline-styles': ['error', { allowBinding: true }],
    'vue/no-unused-refs': isProd ? ['error'] : ['warn'],
    'vue/no-use-v-else-with-v-for': ['error'],
    'vue/no-useless-mustaches': [
      'error',
      {
        ignoreIncludesComment: true,
        ignoreStringEscape: true,
      },
    ],
    'vue/no-v-text': ['error'],
    'vue/padding-line-between-blocks': ['error'],
    'vue/prefer-define-options': ['error'],
    'vue/require-typed-object-prop': ['warn'], // TODO: 'error'
    'vue/require-typed-ref': ['warn'], // TODO: 'error'
    'vue/v-for-delimiter-style': ['error', 'in'],

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
    '@typescript-eslint/no-unused-vars': [
      'error',
      { args: 'after-used', ignoreRestSiblings: true },
    ],
    '@typescript-eslint/no-use-before-define': [
      'error',
      { typedefs: false, enums: false },
    ],
    '@typescript-eslint/consistent-type-assertions': [
      'warn',
      { assertionStyle: 'never' },
    ],
  },

  overrides: [
    {
      files: ['**/*.test.*', '**/*.spec.*'],
      rules: {
        'import/order': 'off',
        'boundaries/element-types': 'off',
      },
    },
  ],
};
