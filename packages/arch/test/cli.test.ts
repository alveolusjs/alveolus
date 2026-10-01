import { describe, expect, it } from "vitest";

import { spawnSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { fixture } from "./fixtures.ts";

const cli = fileURLToPath(new URL("../src/cli/cli.ts", import.meta.url));

const run = (args: string[], cwd = process.cwd()): { status: number | null; stdout: string; stderr: string } => {
	const { status, stdout, stderr } = spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });
	return { status, stderr, stdout };
};

describe("alveolus arch check", () => {
	it("exits with 0 when there is no violation", () => {
		const result = run(["arch", "check", "--project", fixture("valid")]);

		expect(result.status).toBe(0);
		expect(result.stdout.trim()).toBe("✔ No violations");
	});

	it("prints violations relative to the working directory and exits with 1", () => {
		const result = run(["arch", "check"], dirname(fixture("invalid")));

		expect(result.status).toBe(1);
		expect(result.stdout).toContain(
			"src/ordering/domain/aggregates/public-constructor.aggregate.ts:6:2  aggregate/non-public-constructor\n  Basket has a public constructor; make it protected or private and expose static factories.",
		);
		expect(result.stdout.trim().endsWith("✖ 96 violations")).toBe(true);
	});

	it("exits with 2 when the project cannot be found", () => {
		const result = run(["arch", "check", "--project", "missing/tsconfig.json"]);

		expect(result.status).toBe(2);
		expect(result.stderr).toContain("Cannot find");
	});

	it.each([[[]], [["arch"]], [["check"]], [["arch", "check", "--unknown"]]])(
		"prints the usage and exits with 2 for %j",
		(args) => {
			const result = run(args);

			expect(result.status).toBe(2);
			expect(result.stderr.trim()).toBe("Usage: alveolus arch check [--project <tsconfig.json>]");
		},
	);
});
