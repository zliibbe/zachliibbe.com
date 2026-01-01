import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      '.vercel/**',
      'playwright-mcp/**',
      'goodreads-lambda/**',
      '**/*.config.js',
      '**/*.config.mjs',
      '.lintstagedrc.js',
      'jest.setup.js',
      'jest.config.js',
      'next-env.d.ts',
    ],
  },
  {
    plugins: {
      '@next/next': nextPlugin,
    },
  },
  ...compat.extends(
    'next',
    'next/core-web-vitals',
    'next/typescript',
    'prettier',
    'eslint:recommended',
    'plugin:prettier/recommended'
  ),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-unused-vars': 'off',
      indent: 'off',
      '@typescript-eslint/indent': 'off',
      'prettier/prettier': 'error',
      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'off',
    },
  },
];

export default eslintConfig;
