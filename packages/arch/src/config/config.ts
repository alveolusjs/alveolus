import { matchesGlob, relative, resolve, sep } from "node:path";

import type { ContextFolder } from "../architecture/index.ts";
import { AllowedPackages } from "../architecture/index.ts";
import type { CheckSettings } from "../check/index.ts";
import type { RuleId } from "../rules/index.ts";
import type { AlveolusConfig } from "./alveolus-config.ts";

const testFiles: readonly string[] = ["**/*.spec.ts", "**/*.test.ts", "**/__tests__/**"];

/** The configuration of a project, resolved against its directory: what a check reads and how. */
export class Config implements CheckSettings {
	public readonly projectDir: string;
	public readonly rootDir: string;
	public readonly compositionRoot: string;
	public readonly domainDependencies: AllowedPackages;
	/** The packages the application may import: its own, and those of the domain. */
	public readonly applicationDependencies: AllowedPackages;
	public readonly contextFolders: readonly ContextFolder[];
	private readonly ignored: readonly string[];
	private readonly rules: AlveolusConfig["rules"];

	public constructor(config: AlveolusConfig, projectDir: string) {
		this.projectDir = resolve(projectDir);
		this.rootDir = resolve(projectDir, config.root);
		this.compositionRoot = config.compositionRoot ?? "*.module.ts";
		this.domainDependencies = new AllowedPackages(config.domainDependencies);
		this.applicationDependencies = this.domainDependencies.with(new AllowedPackages(config.applicationDependencies));
		this.ignored = [...testFiles, ...(config.ignore ?? [])];
		this.rules = config.rules;

		const sharedKernel = config.sharedKernel ?? "shared-kernel";
		this.contextFolders = [
			...Object.entries(config.boundedContexts).map(([name, folder]) => ({ dir: resolve(this.rootDir, folder), isSharedKernel: false, name })),
			{ dir: resolve(this.rootDir, sharedKernel), isSharedKernel: true, name: "shared kernel" },
		];
	}

	public isIgnored(path: string): boolean {
		const projectPath = relative(this.projectDir, path).split(sep).join("/");
		return this.ignored.some((glob) => matchesGlob(projectPath, glob));
	}

	public isEnabled(rule: RuleId): boolean {
		return this.rules?.[rule] !== "off";
	}
}
