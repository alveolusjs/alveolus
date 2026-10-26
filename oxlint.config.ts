import { defineConfig } from 'oxlint';

export default defineConfig({
	categories: {
		correctness: 'error',
	},
	ignorePatterns: ['**/dist', '**/coverage', '*/.vitepress/cache', '*/.vitepress/dist', '**/generated'],
	rules: {
		curly: 'error',
		'no-else-return': ['error', { allowElseIf: false }],
		'no-lonely-if': 'error',
		'typescript/no-non-null-assertion': 'error',
		'typescript/no-unsafe-type-assertion': 'error',
	},
	overrides: [
		{
			files: ['packages/core/**'],
			rules: { 'typescript/no-unsafe-type-assertion': 'off' },
		},
	],
});
