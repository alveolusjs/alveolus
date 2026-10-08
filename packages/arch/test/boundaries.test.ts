import { describe, expect, it } from "vitest";

import { fileURLToPath } from "node:url";

import { SourceImports } from "./support/source-imports.ts";

/**
 * The pipeline of the package: importer → model → conventions → architecture → rules → check.
 * Each folder of `src/` may import only the folders listed here. See ARCHITECTURE.md.
 */
const allowedImports: Readonly<Record<string, readonly string[]>> = {
	".": ["architecture", "check", "cli", "config", "importer", "rules"],
	architecture: ["conventions", "model"],
	check: ["architecture", "conventions", "importer", "rules"],
	cli: ["check", "config", "importer", "rules"],
	config: ["architecture", "check", "rules"],
	conventions: [],
	importer: ["model"],
	model: [],
	rules: ["architecture", "conventions", "model"],
};

const modules = new SourceImports(fileURLToPath(new URL("../src/", import.meta.url))).modules();

describe("The package", () => {
	it("keeps each folder to the folders it may import", () => {
		const crossings: string[] = [];
		for (const module of modules) {
			const allowed = allowedImports[module.folder] ?? [];
			for (const folder of module.folders) {
				if (!allowed.includes(folder)) {
					crossings.push(`${module.path} imports ${folder}/`);
				}
			}
		}

		expect(crossings).toEqual([]);
	});

	it("reads TypeScript in the importer only", () => {
		const readers = modules.filter((module) => module.packages.includes("ts-morph")).map((module) => module.folder);

		expect([...new Set(readers)]).toEqual(["importer"]);
	});

	it("knows every folder of src/", () => {
		const folders = [...new Set(modules.map((module) => module.folder))].sort();

		expect(folders).toEqual(Object.keys(allowedImports).sort());
	});
});
