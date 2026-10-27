import { defineConfig } from 'tsdown';

export default defineConfig({
	dts: true,
	entry: {
		'dependency-cruiser': 'src/dependency-cruiser.ts',
		'dependency-cruiser-reporter': 'src/dependency-cruiser-reporter.ts',
		oxlint: 'src/oxlint.ts',
	},
	exports: { devExports: '@alveolus/source' },
	format: 'esm',
	sourcemap: true,
});
