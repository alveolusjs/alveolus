import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { ruleIds } from "../src/rules/registry.ts";

const docs = fileURLToPath(new URL("../../../apps/docs/", import.meta.url));
const source = fileURLToPath(new URL("../src/", import.meta.url));

class Documentation {
	public page(path: string): string {
		return readFileSync(`${docs}${path}`, "utf8");
	}

	public sourceOf(path: string): string {
		return readFileSync(`${source}${path}`, "utf8");
	}
}

const documentation = new Documentation();
const sidebar = documentation.page(".vitepress/config.ts");
const rulesIndex = documentation.page("rules/index.md");
const gettingStarted = documentation.page("guide/getting-started.md");

describe("The documentation", () => {
	it("has a page for every rule, listed in the sidebar and in the index, with its limits", () => {
		for (const id of ruleIds) {
			const page = documentation.page(`rules/${id}.md`);

			expect(page, id).toContain(`<code>${id}</code>`);
			expect(page, id).toContain("## Limits");
			expect(sidebar, id).toContain(`"/rules/${id}"`);
			expect(rulesIndex, id).toContain(`[\`${id}\`]`);
		}
	});

	it("documents every key of the configuration", () => {
		const schema = documentation.sourceOf("config/config-loader.ts");
		for (const [, key] of schema.matchAll(/^\t([a-zA-Z]+): z/gm)) {
			expect(gettingStarted, key).toMatch(new RegExp(`\\| \`${key}[\`.]`));
		}
	});

	it("documents every option of the command line", () => {
		const cli = documentation.sourceOf("cli/cli.ts");
		for (const [, option] of cli.matchAll(/"(--[a-z-]+)/g)) {
			expect(gettingStarted, option).toContain(option);
		}
	});

	it("documents every level a rule can take", () => {
		const config = documentation.sourceOf("config/alveolus-config.ts");
		const levels = /RuleSetting = (.+);/.exec(config)?.[1] ?? "";
		for (const [, level] of levels.matchAll(/"([a-z]+)"/g)) {
			expect(rulesIndex, level).toContain(`\`${level}\``);
		}
	});
});
