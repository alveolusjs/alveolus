import { matchesGlob, relative, resolve, sep } from "node:path";

import type { ContextFolder, ExtraFolders } from "../architecture/index.ts";
import { AllowedPackages } from "../architecture/index.ts";
import type { CheckSettings } from "../check/index.ts";
import type { RuleId } from "../rules/index.ts";
import type { AlveolusConfig } from "./alveolus-config.ts";

const testFiles: readonly string[] = ["**/*.spec.ts", "**/*.test.ts", "**/*.e2e-spec.ts", "**/*.fixture.ts", "**/*.fixtures.ts", "**/*.stories.ts", "**/__tests__/**", "**/__mocks__/**"];

export class Config implements CheckSettings {
	public readonly projectDir: string;
	public readonly rootDir: string;
	public readonly tsConfigPath: string;
	public readonly compositionRoot: string;
	public readonly domainDependencies: AllowedPackages;
	public readonly applicationDependencies: AllowedPackages;
	public readonly contextFolders: readonly ContextFolder[];
	public readonly extraFolders: ExtraFolders;
	private readonly ignored: readonly string[];
	private readonly rules: AlveolusConfig["rules"];

	public constructor(config: AlveolusConfig, projectDir: string) {
		this.projectDir = resolve(projectDir);
		this.rootDir = resolve(projectDir, config.root);
		this.tsConfigPath = resolve(projectDir, config.tsconfig ?? "tsconfig.json");
		this.compositionRoot = config.compositionRoot ?? "*.module.ts";
		this.domainDependencies = new AllowedPackages(config.domainDependencies);
		this.applicationDependencies = this.domainDependencies.with(new AllowedPackages(config.applicationDependencies));
		this.ignored = [...testFiles, ...(config.ignore ?? [])];
		this.extraFolders = config.layout?.extraFolders ?? {};
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
