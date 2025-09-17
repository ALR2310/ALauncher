import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import js from '@eslint/js';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintImport from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

const baseRules = {
  'no-empty': 'off',
  'import/first': 'warn',
  'import/no-duplicates': 'warn',
  'simple-import-sort/imports': 'warn',
  'simple-import-sort/exports': 'warn',
  'no-unused-vars': 'off',
  '@typescript-eslint/no-unused-vars': 'off',
  '@typescript-eslint/no-explicit-any': 'off',
};

export default tseslint.config(
  { ignores: ['dist'] },
  // FE (React)
  {
    files: ['src-client/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        project: './src-client/tsconfig.json',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: eslintImport,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      ...baseRules,
    },
  },
  // BE (Node)
  {
    files: ['src-server/**/*.ts', "shared/**/*.ts"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      parser: tseslint.parser,
      parserOptions: {
        project: './src-server/tsconfig.json',
      },
    },
    plugins: {
      import: eslintImport,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      ...baseRules,
    },
  }
);
