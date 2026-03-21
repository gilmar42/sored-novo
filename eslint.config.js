import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

const JS_FILES = ['**/*.{js,jsx,cjs,mjs}'];
const TS_FILES = ['**/*.{ts,tsx,cts,mts}'];
const ALL_SOURCE_FILES = ['**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}'];

const globals = {
  // Node/CommonJS
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

  // Browser
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  fetch: 'readonly',

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

// Convert TS plugin flat configs to apply only on TS files (avoid parsing JS with TS parser).
const tsRecommended = tsPlugin.configs['flat/recommended'].map((cfg) => ({
  ...cfg,
  files: cfg.files ?? TS_FILES,
}));

export default [
  {
    name: 'sored/ignores',
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/coverage/**',
      '**/logs/**',
      'backend/**', // o backend tem seu proprio lint/config
      'src/generated/**',
      'eslint.config.js',
    ],
  },

  // JavaScript base rules
  {
    ...js.configs.recommended,
    name: 'sored/js-recommended',
    files: JS_FILES,
    languageOptions: {
      globals,
    },
  },

  // TypeScript recommended rules
  ...tsRecommended,
  {
    name: 'sored/ts-language-options',
    files: TS_FILES,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals,
    },
    rules: {
      // O projeto ja usa `any` em varios pontos; nao tratar como erro.
      '@typescript-eslint/no-explicit-any': 'off',
      // Evita falso-positivo do rule base no TS (o TS rule cobre melhor).
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Next.js rules (apenas no frontend)
  {
    ...nextPlugin.configs.recommended,
    name: 'sored/next-recommended',
    files: ALL_SOURCE_FILES,
  },
  {
    ...nextPlugin.configs['core-web-vitals'],
    name: 'sored/next-core-web-vitals',
    files: ALL_SOURCE_FILES,
  },
];
