import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Sandbox } from "../../test/support/sandbox.ts";
import { Init } from "./init.ts";

describe("Init", () => {
	let sandbox: Sandbox;

	beforeEach(() => {
		sandbox = new Sandbox("shop");
	});

	afterEach(() => {
		sandbox.remove();
	});

	it("creates what is missing, keeps the configuration, and appends to AGENTS.md once", () => {
		sandbox.write("AGENTS.md", "# Shop\n");
		const init = new Init(sandbox.dir);

		expect(init.run()).toEqual([
			{ outcome: "kept", path: "alveolus.config.ts" },
			{ outcome: "created", path: ".claude/skills/alveolus/SKILL.md" },
			{ outcome: "appended", path: "AGENTS.md" },
		]);
		expect(readFileSync(join(sandbox.dir, "AGENTS.md"), "utf8")).toBe(`# Shop\n\n${readFileSync(join(sandbox.dir, "AGENTS.md"), "utf8").split("\n\n").slice(1).join("\n\n")}`);
		expect(init.run()).toEqual([
			{ outcome: "kept", path: "alveolus.config.ts" },
			{ outcome: "kept", path: ".claude/skills/alveolus/SKILL.md" },
			{ outcome: "kept", path: "AGENTS.md" },
		]);
		expect(init.hint).toBeUndefined();
	});

	it("hints at CLAUDE.md when it exists, since Claude Code then skips AGENTS.md", () => {
		sandbox.write("CLAUDE.md", "# Shop\n");

		expect(new Init(sandbox.dir).hint).toContain("@AGENTS.md");
	});
});
