const js = require('@eslint/js');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

const JS_FILES = ['**/*.{js,jsx,cjs,mjs}'];
const TS_FILES = ['**/*.{ts,tsx,cts,mts}'];

const globals = {
  module: 'readonly',
  require: 'readonly',
  exports: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  process: 'readonly',
  Buffer: 'readonly',
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  setImmediate: 'readonly',

  // Jest
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  jest: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
};

const tsRecommended = tsPlugin.configs['flat/recommended'].map((cfg) => ({
  ...cfg,
  files: cfg.files ?? TS_FILES,
}));

module.exports = [
  {
    name: 'sored-backend/ignores',
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/logs/**',
      'src-legacy-js/**',
      'eslint.config.js',
    ],
  },

  {
    ...js.configs.recommended,
    name: 'sored-backend/js-recommended',
    files: JS_FILES,
    languageOptions: {
      globals,
    },
  },

  ...tsRecommended,
  {
    name: 'sored-backend/ts-language-options',
    files: TS_FILES,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'commonjs',
      },
      globals,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Testes: ser mais permissivo (mocks/fixtures tendem a ter vars nao usadas)
  {
    name: 'sored-backend/tests-overrides',
    files: ['tests/**/*.{ts,tsx,js,jsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      'require-yield': 'off',
    },
  },
];
