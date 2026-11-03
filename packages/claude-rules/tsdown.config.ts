import { defineConfig } from 'tsdown';

export default defineConfig({
	dts: false,
	entry: {
		design: 'src/design.ts',
	},
	format: 'esm',
	sourcemap: true,
});
