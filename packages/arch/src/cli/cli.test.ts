import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

import { Sandbox } from "../../test/support/sandbox.ts";
import { Cli } from "./cli.ts";

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
		cli = new Cli(stdout, stderr, sandbox.dir);
	});

	afterEach(() => {
		sandbox.remove();
	});

	it("passes on a project that respects the rules", async () => {
		expect(await cli.run(["arch", "check"])).toBe(0);
		expect(stdout.text).toBe("No violation\n");
	});

	it("fails and reports each violation", async () => {
		sandbox.write("src/ordering/driven/smtp/adapters/mailer.adapter.ts", "export class Mailer {}\n");

		expect(await cli.run(["arch", "check"])).toBe(1);
		expect(stdout.text).toBe(
			"src/ordering/driven/smtp/adapters/mailer.adapter.ts\n  1  layers/no-portless-adapter: Mailer is a driven adapter but extends no Port: extend the port it implements.\n\n1 violation\n",
		);
	});

	it("reports in JSON", async () => {
		sandbox.write("src/ordering/driven/smtp/adapters/mailer.adapter.ts", "export class Mailer {}\n");

		await cli.run(["arch", "check", "--format", "json"]);

		expect(JSON.parse(stdout.text)).toEqual({
			baselined: 0,
			stale: 0,
			suppressed: [],
			violations: [
				{ file: "src/ordering/driven/smtp/adapters/mailer.adapter.ts", fingerprint: expect.any(String), line: 1, message: expect.any(String), rule: "layers/no-portless-adapter", symbol: "Mailer" },
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
		expect(stdout.text).toContain("1 violation (1 in the baseline)");
	});

	it("asks to write again a baseline from before fingerprints, whose entries match nothing", async () => {
		sandbox.write("src/ordering/driven/smtp/adapters/mailer.adapter.ts", "export class Mailer {}\n");
		sandbox.write("alveolus.baseline.json", JSON.stringify({ violations: [{ file: "src/ordering/driven/smtp/adapters/mailer.adapter.ts", rule: "layers/no-portless-adapter", symbol: "Mailer" }] }));

		expect(await cli.run(["arch", "check"])).toBe(1);
		expect(stderr.text).toContain("1 entry of the baseline has no fingerprint and matches nothing: run alveolus arch baseline to write alveolus.baseline.json again.");
	});

	it("turns a rule off from the configuration", async () => {
		sandbox.write("src/ordering/driven/smtp/adapters/mailer.adapter.ts", "export class Mailer {}\n");
		sandbox.write("alveolus.config.ts", `export default { boundedContexts: { catalog: "catalog", ordering: "ordering" }, root: "src", rules: { "layers/no-portless-adapter": "off" } };\n`);

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
		expect(stdout.text).toBe("No violation (1 fixed, 1 disabled)\n");
		expect(stderr.text).toContain("1 entry of the baseline match nothing any more: run alveolus arch baseline to drop it.");
	});
});
