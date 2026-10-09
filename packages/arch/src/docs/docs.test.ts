import { describe, expect, it } from "vitest";

import { fileURLToPath } from "node:url";

import { Sandbox } from "../../test/support/sandbox.ts";
import { Docs } from "./docs.ts";

const docs = new Docs(fileURLToPath(new URL("../../../../apps/docs/", import.meta.url)));

describe("Docs", () => {
	it("lists every page of the sections it ships, an index by its folder", () => {
		const topics = docs.topics();

		expect(topics).toContain("rules");
		expect(topics).toContain("rules/layers/no-impure-domain");
		expect(topics).toContain("core/domain");
		expect(topics).toContain("core/domain/aggregates");
		expect(topics).toContain("guide/getting-started");
		expect(topics).toContain("integrations/nestjs");
		expect(topics.some((topic) => topic.includes("index"))).toBe(false);
		expect(topics).toEqual([...topics].sort());
	});

	it("finds a page by its topic, by a suffix of it, or by its file name", () => {
		for (const name of ["rules/layers/no-impure-domain", "layers/no-impure-domain", "no-impure-domain", "no-impure-domain.md", "layers\\no-impure-domain"]) {
			const match = docs.find(name);
			expect(match, name).toHaveProperty("page");
			if ("page" in match) {
				expect(match.page.topic).toBe("rules/layers/no-impure-domain");
			}
		}
	});

	it("reads an index by its folder", () => {
		const match = docs.find("domain");
		expect(match).toHaveProperty("page");
		if ("page" in match) {
			expect(match.page.topic).toBe("core/domain");
			expect(match.page.text()).toMatch(/^# /);
		}
	});

	it("answers the candidates when a name is ambiguous, none when it is unknown", () => {
		const sandbox = new Sandbox("shop").write("core/utilities/result.md", "# Result\n").write("guide/result.md", "# Result\n").write("guide/index.md", "# Guide\n");
		try {
			const ambiguous = new Docs(sandbox.dir);

			expect(ambiguous.find("result")).toEqual({ candidates: ["core/utilities/result", "guide/result"] });
			expect(ambiguous.find("guide/result")).toHaveProperty("page");
			expect(ambiguous.find("nothing-here")).toEqual({ candidates: [] });
		} finally {
			sandbox.remove();
		}
	});
});
