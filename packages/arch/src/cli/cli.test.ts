import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { existsSync } from "node:fs";
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
		sandbox.write("src/ordering/driven/adapters/mailer.adapter.ts", "export class Mailer {}\n");

		expect(await cli.run(["arch", "check"])).toBe(1);
		expect(stdout.text).toBe(
			"src/ordering/driven/adapters/mailer.adapter.ts:1\n  driven-adapters-extend-port: Mailer is a driven adapter but extends no Port: extend the port it implements.\n\n1 violation\n",
		);
	});

	it("reports in JSON", async () => {
		sandbox.write("src/ordering/driven/adapters/mailer.adapter.ts", "export class Mailer {}\n");

		await cli.run(["arch", "check", "--format", "json"]);

		expect(JSON.parse(stdout.text)).toEqual({
			baselined: 0,
			violations: [{ file: "src/ordering/driven/adapters/mailer.adapter.ts", line: 1, message: expect.any(String), rule: "driven-adapters-extend-port", symbol: "Mailer" }],
		});
	});

	it("ignores the violations of the baseline and catches new ones", async () => {
		sandbox.write("src/ordering/driven/adapters/mailer.adapter.ts", "export class Mailer {}\n");

		expect(await cli.run(["arch", "baseline"])).toBe(0);
		expect(existsSync(join(sandbox.dir, "alveolus.baseline.json"))).toBe(true);
		expect(await cli.run(["arch", "check"])).toBe(0);

		sandbox.write("src/ordering/driven/adapters/sms.adapter.ts", "export class Sms {}\n");
		stdout.text = "";

		expect(await cli.run(["arch", "check"])).toBe(1);
		expect(stdout.text).toContain("sms.adapter.ts:1");
		expect(stdout.text).toContain("1 violation (1 in the baseline)");
	});

	it("turns a rule off from the configuration", async () => {
		sandbox.write("src/ordering/driven/adapters/mailer.adapter.ts", "export class Mailer {}\n");
		sandbox.write("alveolus.config.ts", `export default { boundedContexts: { catalog: "catalog", ordering: "ordering" }, root: "src", rules: { "driven-adapters-extend-port": "off" } };\n`);

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
});
