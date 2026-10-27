import { defineConfig } from 'tsdown';

export default defineConfig({
	dts: true,
	entry: {
		'dependency-cruiser': 'src/dependency-cruiser.ts',
		'dependency-cruiser-reporter': 'src/dependency-cruiser-reporter.ts',
		eslint: 'src/eslint.ts',
		'eslint-formatter': 'src/eslint-formatter.ts',
	},
	exports: { devExports: '@alveolus/source' },
	format: 'esm',
	sourcemap: true,
});
