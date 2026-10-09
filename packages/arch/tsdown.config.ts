import { defineConfig } from "tsdown";

import { cpSync, rmSync } from "node:fs";
import { basename, extname } from "node:path";

const docs = ["guide", "integrations", "core", "rules"];

export default defineConfig({
	dts: true,
	entry: { bin: "src/bin.ts", index: "src/index.ts" },
	exports: { bin: { alveolus: "./src/bin.ts" }, devExports: "@alveolus/source" },
	format: "esm",
	hooks: {
		"build:done": () => {
			rmSync("docs", { force: true, recursive: true });
			for (const section of docs) {
				cpSync(`../../apps/docs/${section}`, `docs/${section}`, { filter: (source) => !basename(source).startsWith(".") && [".md", ""].includes(extname(source)), recursive: true });
			}
		},
	},
	sourcemap: true,
});
