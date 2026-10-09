import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { Sandbox } from "../../test/support/sandbox.ts";
import { Docs } from "../docs/index.ts";
import { Cli } from "./cli.ts";

const docs = new Docs(fileURLToPath(new URL("../../../../apps/docs/", import.meta.url)));

class Recorder {
	public text = "";

	public write(text: string): void {
		this.text += text;
	}
}

describe("Cli", () => {
	let sandbox: Sandbox;
	let stdout: Recorder;
	let stderr: Recorder;
	let cli: Cli;

	beforeEach(() => {
		sandbox = new Sandbox("shop");
		stdout = new Recorder();
		stderr = new Recorder();
		cli = new Cli(stdout, stderr, sandbox.dir, docs);
	});

	afterEach(() => {
		sandbox.remove();
	});

	it("passes on a project that respects the rules", async () => {
		expect(await cli.run(["arch", "check"])).toBe(0);
		expect(stdout.text).toMatch(/^No violation in \d+ files\n$/);
	});

	it("fails and reports each violation", async () => {
		sandbox.write("src/ordering/driven/smtp/adapters/mailer.adapter.ts", "export class Mailer {}\n");

		expect(await cli.run(["arch", "check"])).toBe(1);
		expect(stdout.text).toMatch(
			/^src\/ordering\/driven\/smtp\/adapters\/mailer\.adapter\.ts\n {2}1 {2}error {2}layers\/no-portless-adapter: Mailer is a driven adapter but extends no Port: extend the port it implements\.\n\n1 error in \d+ files\n\nWhy, and how to fix it: npx alveolus explain <rule>\n$/,
		);
	});

	it("reports in JSON", async () => {
		sandbox.write("src/ordering/driven/smtp/adapters/mailer.adapter.ts", "export class Mailer {}\n");

		await cli.run(["arch", "check", "--format", "json"]);

		expect(JSON.parse(stdout.text)).toEqual({
			baselined: 0,
			files: expect.any(Number),
			stale: 0,
			suppressed: [],
			violations: [
				{
					file: "src/ordering/driven/smtp/adapters/mailer.adapter.ts",
					fingerprint: expect.any(String),
					line: 1,
					message: expect.any(String),
					rule: "layers/no-portless-adapter",
					severity: "error",
					symbol: "Mailer",
				},
			],
		});
	});

	it("ignores the violations of the baseline and catches new ones", async () => {
		sandbox.write("src/ordering/driven/smtp/adapters/mailer.adapter.ts", "export class Mailer {}\n");

		expect(await cli.run(["arch", "baseline"])).toBe(0);
		expect(existsSync(join(sandbox.dir, "alveolus.baseline.json"))).toBe(true);
		expect(await cli.run(["arch", "check"])).toBe(0);

		sandbox.write("src/ordering/driven/smtp/adapters/sms.adapter.ts", "export class Sms {}\n");
		stdout.text = "";

		expect(await cli.run(["arch", "check"])).toBe(1);
		expect(stdout.text).toContain("sms.adapter.ts\n  1  ");
		expect(stdout.text).toMatch(/1 error in \d+ files \(1 in the baseline\)/);
	});

	it("asks to write again a baseline from before fingerprints, whose entries match nothing", async () => {
		sandbox.write("src/ordering/driven/smtp/adapters/mailer.adapter.ts", "export class Mailer {}\n");
		sandbox.write("alveolus.baseline.json", JSON.stringify({ violations: [{ file: "src/ordering/driven/smtp/adapters/mailer.adapter.ts", rule: "layers/no-portless-adapter", symbol: "Mailer" }] }));

		expect(await cli.run(["arch", "check"])).toBe(1);
		expect(stderr.text).toContain("1 entry of the baseline has no fingerprint and matches nothing: run alveolus arch baseline to write alveolus.baseline.json again.");
	});

	it("turns a rule off from the configuration", async () => {
		sandbox.write("src/ordering/driven/smtp/adapters/mailer.adapter.ts", "export class Mailer {}\n");
		sandbox.write(
			"alveolus.config.ts",
			`export default { boundedContexts: { catalog: "catalog", ordering: "ordering" }, root: "src", rules: { "layers/no-portless-adapter": "off" }, subdomains: { core: ["catalog", "ordering"] } };\n`,
		);

		expect(await cli.run(["arch", "check"])).toBe(0);
	});

	it("explains an invalid configuration", async () => {
		sandbox.write("alveolus.config.ts", `export default { root: 42 };\n`);

		expect(await cli.run(["arch", "check"])).toBe(2);
		expect(stderr.text).toContain("Invalid configuration");
		expect(stderr.text).toContain("root");
	});

	it("explains a missing configuration", async () => {
		expect(await cli.run(["arch", "check", "--config", "missing.config.ts"])).toBe(2);
		expect(stderr.text).toContain("No configuration found");
	});

	it("shows the usage on an unknown command", async () => {
		expect(await cli.run(["arch", "unknown"])).toBe(2);
		expect(stderr.text).toContain("unknown command");
	});

	it("reads the sources with the TypeScript configuration passed on the command line", async () => {
		sandbox.write("tsconfig.build.json", readFileSync(join(sandbox.dir, "tsconfig.json"), "utf8"));
		rmSync(join(sandbox.dir, "tsconfig.json"));

		expect(await cli.run(["arch", "check", "--tsconfig", "tsconfig.build.json"])).toBe(0);
		expect(await cli.run(["arch", "check"])).toBe(2);
		expect(stderr.text).toContain("No TypeScript configuration found at");
		expect(stderr.text).toContain("pass --tsconfig");
	});

	it("writes SARIF for code scanning", async () => {
		sandbox.write("src/ordering/driven/smtp/adapters/mailer.adapter.ts", "export class Mailer {}\n");

		await cli.run(["arch", "check", "--format", "sarif"]);
		const log = JSON.parse(stdout.text);

		expect(log.version).toBe("2.1.0");
		expect(log.runs[0].results).toHaveLength(1);
		expect(log.runs[0].results[0].ruleId).toBe("layers/no-portless-adapter");
		expect(log.runs[0].tool.driver.rules.map((rule: { id: string }) => rule.id)).toContain("layers/no-portless-adapter");
	});

	it("counts the violations a disable comment turns off, and says when the baseline covers fixed ones", async () => {
		sandbox.write("src/ordering/driven/smtp/adapters/mailer.adapter.ts", "export class Mailer {}\n");
		expect(await cli.run(["arch", "baseline"])).toBe(0);
		sandbox.write("src/ordering/driven/smtp/adapters/mailer.adapter.ts", "// alveolus-disable-next-line layers/no-portless-adapter: wrapped later\nexport class Mailer {}\n");
		stdout.text = "";

		expect(await cli.run(["arch", "check"])).toBe(0);
		expect(stdout.text).toMatch(/^No violation in \d+ files \(1 fixed, 1 disabled\)\n$/);
		expect(stderr.text).toContain("1 entry of the baseline match nothing any more: run alveolus arch baseline to drop it.");
	});

	it("refuses to write a baseline that grows, unless asked to", async () => {
		sandbox.write("src/ordering/driven/smtp/adapters/mailer.adapter.ts", "export class Mailer {}\n");
		expect(await cli.run(["arch", "baseline"])).toBe(0);
		sandbox.write("src/ordering/driven/smtp/adapters/sms.adapter.ts", "export class Sms {}\n");

		expect(await cli.run(["arch", "baseline"])).toBe(1);
		expect(stderr.text).toContain("The baseline would grow from 1 to 2 entries: fix the new violations, or pass --allow-growth.");
		expect(await cli.run(["arch", "baseline", "--allow-growth"])).toBe(0);
	});

	it("fails on errors only: a warning or an info never fails the check", async () => {
		sandbox.write("src/ordering/driven/smtp/adapters/mailer.adapter.ts", "export class Mailer {}\n");
		sandbox.write(
			"alveolus.config.ts",
			`export default { boundedContexts: { catalog: "catalog", ordering: "ordering" }, root: "src", rules: { "layers/no-portless-adapter": "warn" }, subdomains: { core: ["catalog", "ordering"] } };\n`,
		);

		expect(await cli.run(["arch", "check"])).toBe(0);
		expect(stdout.text).toContain("  1  warn  layers/no-portless-adapter:");
		expect(stdout.text).toMatch(/1 warning in \d+ files/);
	});

	it("refuses an unknown format", async () => {
		expect(await cli.run(["arch", "check", "--format", "yaml"])).toBe(2);
		expect(stderr.text).toContain("Allowed choices are text, json, sarif");
	});

	it("prints a page of the documentation, found by its topic, its rule id or its name", async () => {
		expect(await cli.run(["explain", "layers/no-impure-domain"])).toBe(0);
		expect(stdout.text).toMatch(/^# no-impure-domain\n/);
		expect(stdout.text).toContain("- Rule: layers/no-impure-domain");
		expect(stdout.text).toContain("## Fix it");
		expect(stdout.text).not.toContain("<dl");

		stdout.text = "";
		expect(await cli.run(["explain", "aggregates"])).toBe(0);
		expect(stdout.text).toMatch(/^# Aggregates\n/);
	});

	it("lists the topics when none is given", async () => {
		expect(await cli.run(["explain"])).toBe(0);
		expect(stdout.text).toContain("rules/layers/no-impure-domain\n");
		expect(stdout.text).toContain("core/domain/aggregates\n");
		expect(stdout.text).toContain("guide/project-layout\n");
	});

	it("refuses an unknown or ambiguous topic", async () => {
		expect(await cli.run(["explain", "nothing"])).toBe(1);
		expect(stderr.text).toBe("No page for nothing: alveolus explain lists the topics.\n");

		sandbox.write("core/utilities/result.md", "# Result\n").write("guide/result.md", "# Result\n");
		stderr.text = "";
		expect(await new Cli(stdout, stderr, sandbox.dir, new Docs(sandbox.dir)).run(["explain", "result"])).toBe(1);
		expect(stderr.text).toBe("No page for result: Did you mean core/utilities/result, guide/result?\n");
	});

	it("writes the configuration and the instructions for an agent, and keeps what exists", async () => {
		sandbox.write("AGENTS.md", "# Shop\n\nRun the tests.\n");

		expect(await cli.run(["init"])).toBe(0);

		expect(stdout.text).toBe(
			"kept  alveolus.config.ts\ncreated  .claude/skills/alveolus/SKILL.md\nappended  AGENTS.md\nName your bounded contexts in alveolus.config.ts, then run alveolus arch check.\n",
		);
		expect(readFileSync(join(sandbox.dir, "AGENTS.md"), "utf8")).toMatch(/^# Shop\n\nRun the tests\.\n\n## Alveolus\n/);
		expect(readFileSync(join(sandbox.dir, ".claude/skills/alveolus/SKILL.md"), "utf8")).toMatch(/^---\nname: alveolus\n/);
		expect(stderr.text).toBe("");

		stdout.text = "";
		expect(await cli.run(["init"])).toBe(0);
		expect(stdout.text).toContain("kept  AGENTS.md\n");
	});

	it("starts a project from scratch and points at CLAUDE.md when it exists", async () => {
		sandbox.write("CLAUDE.md", "# Shop\n");

		expect(await cli.run(["init", "--project", "fresh"])).toBe(0);
		expect(stdout.text).toContain("created  alveolus.config.ts\n");
		expect(readFileSync(join(sandbox.dir, "fresh/alveolus.config.ts"), "utf8")).toContain("boundedContexts: {}");
		expect(readFileSync(join(sandbox.dir, "fresh/AGENTS.md"), "utf8")).toMatch(/^## Alveolus\n/);
		expect(stderr.text).toBe("");

		expect(await cli.run(["init"])).toBe(0);
		expect(stderr.text).toContain("CLAUDE.md exists");
	});

	it("refuses to check when no file is analysed", async () => {
		sandbox.write("alveolus.config.ts", `export default { boundedContexts: { catalog: "catalog", ordering: "ordering" }, root: "elsewhere", subdomains: { core: ["catalog", "ordering"] } };\n`);

		expect(await cli.run(["arch", "check"])).toBe(2);
		expect(stderr.text).toContain("No file to analyse under");
	});
});
