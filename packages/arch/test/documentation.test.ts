import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { Docs } from "../src/docs/index.ts";
import { scaffolds } from "../src/init/index.ts";
import { RuleRegistry, ruleIds } from "../src/rules/registry.ts";

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
const local = new Docs(docs);
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

	it("says on each rule page whether the rule applies to every bounded context or to the core domain only", () => {
		for (const rule of new RuleRegistry().rules) {
			const page = documentation.page(`rules/${rule.meta.id}.md`);
			const appliesTo = /<dt>Applies to<\/dt><dd>(.*)<\/dd>/.exec(page)?.[1] ?? "";

			expect(appliesTo.includes("core"), `${rule.meta.id}: ${appliesTo}`).toBe(rule.meta.contexts === "core");
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

	it("ships every section of the sidebar with the package, for alveolus explain", () => {
		const build = readFileSync(fileURLToPath(new URL("../tsdown.config.ts", import.meta.url)), "utf8");
		for (const [, section = ""] of sidebar.matchAll(/link: "\/([a-z]+)\//g)) {
			expect(Docs.sections, section).toContain(section);
			expect(build, section).toContain(`"${section}"`);
		}
	});

	it("explains every rule by its id, and every topic the instructions for an agent name", () => {
		for (const id of ruleIds) {
			expect(local.find(id), id).toHaveProperty("page");
		}
		for (const scaffold of scaffolds) {
			for (const [, topic = ""] of scaffold.content.matchAll(/`(?:npx alveolus explain )?([a-z-]+)`/g)) {
				expect(local.find(topic), topic).toHaveProperty("page");
			}
		}
	});

	it("documents every command of the command line", () => {
		const cli = documentation.sourceOf("cli/cli.ts");
		for (const [, command = ""] of cli.matchAll(/\.command\("([a-z]+)"\)/g)) {
			expect(gettingStarted, command).toMatch(new RegExp(`npx alveolus (arch )?${command}`));
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
