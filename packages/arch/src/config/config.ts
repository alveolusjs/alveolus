import { matchesGlob, relative, resolve, sep } from "node:path";

import type { AlveolusConfig, RuleId } from "./alveolus-config.ts";

export interface ContextFolder {
	readonly name: string;
	readonly dir: string;
	readonly isSharedKernel: boolean;
}

const testFiles: readonly string[] = ["**/*.spec.ts", "**/*.test.ts", "**/__tests__/**"];

export class Config {
	public readonly projectDir: string;
	public readonly rootDir: string;
	public readonly compositionRoot: string;
	public readonly domainDependencies: readonly string[];
	public readonly contextFolders: readonly ContextFolder[];
	private readonly ignored: readonly string[];
	private readonly rules: AlveolusConfig["rules"];

	public constructor(config: AlveolusConfig, projectDir: string) {
		this.projectDir = resolve(projectDir);
		this.rootDir = resolve(projectDir, config.root);
		this.compositionRoot = config.compositionRoot ?? "*.module.ts";
		this.domainDependencies = config.domainDependencies ?? [];
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
