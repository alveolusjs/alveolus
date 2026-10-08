import { Command, CommanderError, Option } from "commander";

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import type { CheckOutcome } from "../check/index.ts";
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
	readonly tsconfig?: string;
	readonly allowGrowth?: boolean;
	readonly format: "text" | "json" | "sarif";
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
		this.exitCode = 0;
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
		this.withOptions(arch.command("baseline").description(`Write the current violations to ${Baseline.fileName}`))
			.option("--allow-growth", "write the baseline even when it holds more entries than before")
			.action((options: Options) => this.baseline(options));

		return program;
	}

	private withOptions(command: Command): Command {
		return command
			.option("--project <dir>", "project directory", ".")
			.option("--config <file>", "configuration file", ConfigLoader.fileName)
			.option("--tsconfig <file>", "TypeScript configuration, tsconfig.json or the one set in the configuration file")
			.addOption(new Option("--format <format>", "how violations are printed").choices(["text", "json", "sarif"]).default("text"));
	}

	private async check(options: Options): Promise<void> {
		const { config, registry, outcome } = await this.analyze(options);
		const baseline = await Baseline.load(join(config.projectDir, Baseline.fileName));
		const fresh = baseline.newViolations(outcome.violations);
		const stale = baseline.staleEntries(outcome.violations);
		if (baseline.outdatedEntries > 0) {
			this.warnOutdated(baseline.outdatedEntries);
		}
		if (stale > 0) {
			this.stderr.write(`${stale} ${stale === 1 ? "entry" : "entries"} of the baseline match nothing any more: run alveolus arch baseline to drop ${stale === 1 ? "it" : "them"}.\n`);
		}
		const report = new Report({ baselined: outcome.violations.length - fresh.length, files: outcome.files, stale, suppressed: outcome.suppressed, violations: fresh }, this.colored);

		this.stdout.write(this.render(report, options.format, registry));
		this.exitCode = fresh.some((violation) => violation.severity === "error") ? 1 : 0;
	}

	private render(report: Report, format: Options["format"], registry: RuleRegistry): string {
		if (format === "json") {
			return report.json();
		}
		if (format === "sarif") {
			return report.sarif(registry.rules.map((rule) => rule.meta));
		}
		return report.text();
	}

	private warnOutdated(count: number): void {
		const entries = count === 1 ? "1 entry of the baseline has no fingerprint and matches" : `${count} entries of the baseline have no fingerprint and match`;
		this.stderr.write(`${entries} nothing: run alveolus arch baseline to write ${Baseline.fileName} again.\n`);
	}

	private async baseline(options: Options): Promise<void> {
		const { config, outcome } = await this.analyze(options);
		const path = join(config.projectDir, Baseline.fileName);
		const previous = (await Baseline.load(path)).size;
		if (existsSync(path) && outcome.violations.length > previous && options.allowGrowth !== true) {
			this.stderr.write(`The baseline would grow from ${previous} to ${outcome.violations.length} entries: fix the new violations, or pass --allow-growth.\n`);
			this.exitCode = 1;
			return;
		}
		await Baseline.of(outcome.violations).save(path);
		this.stdout.write(`${outcome.violations.length} violations written to ${Baseline.fileName}\n`);
	}

	private async analyze(options: Options): Promise<{ config: Config; registry: RuleRegistry; outcome: CheckOutcome }> {
		const projectDir = resolve(this.cwd, options.project);
		const config = await new ConfigLoader().load(projectDir, options.config);
		const tsConfigPath = options.tsconfig === undefined ? config.tsConfigPath : resolve(config.projectDir, options.tsconfig);
		const registry = new RuleRegistry();
		const checker = new Checker(TsMorphImporter.fromTsConfig(tsConfigPath), registry.rules);
		return { config, outcome: checker.check(config), registry };
	}

	private fail(error: unknown): number {
		if (error instanceof CommanderError) {
			return error.exitCode === 0 ? 0 : 2;
		}
		this.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
		return 2;
	}
}
