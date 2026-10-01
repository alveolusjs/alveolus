import { defineConfig } from "tsdown";

export default defineConfig({
	dts: true,
	entry: { cli: "src/cli/cli.ts", index: "src/index.ts" },
	exports: {
		bin: { alveolus: "./src/cli/cli.ts" },
		devExports: "@alveolus/source",
		exclude: [/cli/],
	},
	format: "esm",
	sourcemap: true,
});
