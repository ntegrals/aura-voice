import typescriptEslint from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...compat.extends(
    'next',
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier,
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'module',

      parserOptions: {
        files: ['*.ts', '*.tsx'],
        project: './tsconfig.json',
      },
    },
    ignores: [
      '*.d.ts',
      'node_modules',
      'dist',
      'build',
      'eslint.config.mjs',
      '.prttierrc.js',
      '.config/*',
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/no-explicit-any': 'off',
      '@next/next/no-img-element': 'off',
      'prettier/prettier': 'error',
    },
  },
];
