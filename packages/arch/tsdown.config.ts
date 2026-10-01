import { defineConfig } from "tsdown";

export default defineConfig({
	dts: true,
	entry: { bin: "src/bin.ts", index: "src/index.ts" },
	exports: { bin: { alveolus: "./src/bin.ts" }, devExports: "@alveolus/source" },
	format: "esm",
	sourcemap: true,
});
