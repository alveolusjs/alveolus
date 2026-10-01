import { defineConfig } from "tsdown";

import { globSync } from "node:fs";
import { basename, dirname } from "node:path";

const entry = Object.fromEntries(
	globSync("src/**/index.ts").map((file) => [
		file === "src/index.ts" ? "index" : `${basename(dirname(file))}/index`,
		file,
	]),
);

export default defineConfig({
	dts: true,
	entry,
	exports: { devExports: "@alveolus/source" },
	format: "esm",
	sourcemap: true,
});
