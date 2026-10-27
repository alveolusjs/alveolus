import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
	globalIgnores(['**/dist', '**/coverage', 'docs/.vitepress/cache', 'docs/.vitepress/dist', '**/generated']),
	js.configs.recommended,
	tseslint.configs.recommended,
	{
		languageOptions: {
			globals: { Buffer: 'readonly', console: 'readonly', process: 'readonly', URL: 'readonly' },
		},
		rules: {
			curly: 'error',
			'no-else-return': ['error', { allowElseIf: false }],
			'no-lonely-if': 'error',
			'@typescript-eslint/ban-ts-comment': ['error', { 'ts-expect-error': false }],
			'@typescript-eslint/no-non-null-assertion': 'error',
			'@typescript-eslint/parameter-properties': 'error',
		},
	},
	{
		files: ['packages/*/src/**/*.ts', 'packages/*/test/**/*.ts'],
		languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
		rules: { '@typescript-eslint/no-unsafe-type-assertion': 'error' },
	},
	{
		files: ['packages/core/**'],
		rules: { '@typescript-eslint/no-unsafe-type-assertion': 'off' },
	},
);
