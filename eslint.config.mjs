import html from '@html-eslint/eslint-plugin'
import htmlParser from '@html-eslint/parser'
import sonarjs from 'eslint-plugin-sonarjs'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'
import js from '@eslint/js'

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  {
    ignores: ['public', '**/xloader*.html.twig', '**/xform*.html.twig'],
  },
  js.configs.recommended,
  sonarjs.configs.recommended,
  {
    files: ['./src/scripts/**/*.js'],
    plugins: {
      sonarjs,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,
      'sonarjs/cognitive-complexity': ['error', 50],
    },
  },
  {
    ...html.configs['flat/recommended'],
    files: ['./src/html/**/*.html.twig'],
    languageOptions: {
      parser: htmlParser,
    },
    plugins: {
      '@html-eslint': html,
    },
    rules: {
      ...html.configs['flat/recommended'].rules,
      '@html-eslint/no-script-style-type': 'error',
      '@html-eslint/require-button-type': 'error',
      '@html-eslint/require-meta-charset': 'error',
      '@html-eslint/require-meta-description': 'error',
      '@html-eslint/no-abstract-roles': 'error',
      '@html-eslint/no-accesskey-attrs': 'error',
      '@html-eslint/no-aria-hidden-body': 'error',
      '@html-eslint/no-non-scalable-viewport': 'error',
      '@html-eslint/no-positive-tabindex': 'error',
      '@html-eslint/require-frame-title': 'error',
      '@html-eslint/require-meta-viewport': 'error',
      '@html-eslint/id-naming-convention': ['error', 'kebab-case'],
      '@html-eslint/indent': ['error', 2],
      '@html-eslint/lowercase': 'error',
      '@html-eslint/no-multiple-empty-lines': ['error', { max: 1 }],
      '@html-eslint/no-trailing-spaces': 'error',
      '@html-eslint/sort-attrs': [
        'error',
        {
          priority: [
            'class',
            'id',
            'type',
            'name',
            'content',
            'rel',
            'src',
            'alt',
          ],
        },
      ],
    },
  },
  prettierRecommended,
]
