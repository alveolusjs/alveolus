import { Command, CommanderError } from "commander";

import { join, resolve } from "node:path";

import type { Violation } from "../check/index.ts";
import { Baseline, Checker, Report } from "../check/index.ts";
import type { Config } from "../config/index.ts";
import { ConfigLoader } from "../config/index.ts";
import { TsMorphImporter } from "../importer/index.ts";
import { RuleRegistry } from "../rules/index.ts";

interface Output {
	write(text: string): unknown;
}

interface Options {
	readonly project: string;
	readonly config?: string;
	readonly format: "text" | "json";
}

export class Cli {
	private exitCode = 0;

	public constructor(
		private readonly stdout: Output,
		private readonly stderr: Output,
		private readonly cwd: string,
		private readonly colored = false,
	) {}

	public async run(args: readonly string[]): Promise<number> {
		try {
			await this.program().parseAsync([...args], { from: "user" });
		} catch (error) {
			return this.fail(error);
		}
		return this.exitCode;
	}

	private program(): Command {
		const program = new Command("alveolus").exitOverride().configureOutput({
			writeErr: (text) => this.stderr.write(text),
			writeOut: (text) => this.stdout.write(text),
		});
		const arch = program.command("arch").description("Check the architecture of a Domain-Driven Design project");

		this.withOptions(arch.command("check").description("Report the violations that are not in the baseline")).action((options: Options) => this.check(options));
		this.withOptions(arch.command("baseline").description(`Write the current violations to ${Baseline.fileName}`)).action((options: Options) => this.baseline(options));

		return program;
	}

	private withOptions(command: Command): Command {
		return command.option("--project <dir>", "project directory", ".").option("--config <file>", "configuration file", ConfigLoader.fileName).option("--format <format>", "text or json", "text");
	}

	private async check(options: Options): Promise<void> {
		const { config, violations } = await this.analyze(options);
		const baseline = await Baseline.load(join(config.projectDir, Baseline.fileName));
		const fresh = baseline.newViolations(violations);
		if (baseline.outdatedEntries > 0) {
			this.warnOutdated(baseline.outdatedEntries);
		}
		const report = new Report(fresh, violations.length - fresh.length, this.colored);

		this.stdout.write(options.format === "json" ? report.json() : report.text());
		this.exitCode = fresh.length === 0 ? 0 : 1;
	}

	private warnOutdated(count: number): void {
		const entries = count === 1 ? "1 entry of the baseline has no fingerprint and matches" : `${count} entries of the baseline have no fingerprint and match`;
		this.stderr.write(`${entries} nothing: run alveolus arch baseline to write ${Baseline.fileName} again.\n`);
	}

	private async baseline(options: Options): Promise<void> {
		const { config, violations } = await this.analyze(options);
		await Baseline.of(violations).save(join(config.projectDir, Baseline.fileName));
		this.stdout.write(`${violations.length} violations written to ${Baseline.fileName}\n`);
	}

	private async analyze(options: Options): Promise<{ config: Config; violations: Violation[] }> {
		const projectDir = resolve(this.cwd, options.project);
		const config = await new ConfigLoader().load(projectDir, options.config);
		const checker = new Checker(TsMorphImporter.fromTsConfig(config.projectDir), new RuleRegistry().rules);
		return { config, violations: checker.check(config) };
	}

	private fail(error: unknown): number {
		if (error instanceof CommanderError) {
			return error.exitCode === 0 ? 0 : 2;
		}
		this.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
		return 2;
	}
}
