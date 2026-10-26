import { defineProject } from 'vitest/config';

export default defineProject({
	test: {
		include: ['src/**/*.test.ts'],
		name: 'lint-config',
		testTimeout: 30_000,
	},
});
