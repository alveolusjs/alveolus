import { defineConfig } from 'tsdown';

export default defineConfig({
	dts: true,
	entry: {
		'dependency-cruiser': 'src/dependency-cruiser.ts',
		oxlint: 'src/oxlint.ts',
	},
	exports: { devExports: '@alveolus/source' },
	format: 'esm',
	sourcemap: true,
});
