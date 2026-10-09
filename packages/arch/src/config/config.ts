import { matchesGlob, relative, resolve, sep } from "node:path";

import type { ContextFolder, ExtraFolders, Subdomains, SubdomainType } from "../architecture/index.ts";
import { AllowedPackages, ContextMap, Layout } from "../architecture/index.ts";
import type { CheckSettings, Severity } from "../check/index.ts";
import type { RuleId } from "../rules/index.ts";
import type { AlveolusConfig, ContextMapConfig } from "./alveolus-config.ts";

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
	public readonly contextMap: ContextMap;
	private readonly ignored: readonly string[];
	private readonly rules: AlveolusConfig["rules"];
	private readonly layout: Layout;

	public constructor(config: AlveolusConfig, projectDir: string) {
		this.projectDir = resolve(projectDir);
		this.rootDir = resolve(projectDir, config.root);
		this.tsConfigPath = resolve(projectDir, config.tsconfig ?? "tsconfig.json");
		this.compositionRoot = config.compositionRoot ?? "*.module.ts";
		this.domainDependencies = new AllowedPackages(config.domainDependencies);
		this.applicationDependencies = this.domainDependencies.with(new AllowedPackages(config.applicationDependencies));
		this.ignored = [...testFiles, ...(config.ignore ?? [])];
		this.extraFolders = config.layout?.extraFolders ?? {};
		this.contextMap = this.validContextMap(config.contextMap, Object.keys(config.boundedContexts));
		this.rules = config.rules;

		const sharedKernel = config.sharedKernel ?? "shared-kernel";
		this.contextFolders = [...this.classifiedContexts(config.subdomains ?? {}, config.boundedContexts), { dir: resolve(this.rootDir, sharedKernel), isSharedKernel: true, name: "shared kernel" }];
		this.layout = new Layout(this);
	}

	private classifiedContexts(subdomains: Subdomains, boundedContexts: AlveolusConfig["boundedContexts"]): ContextFolder[] {
		const types: readonly SubdomainType[] = ["core", "supporting", "generic"];
		const classified = new Map<string, SubdomainType>();
		const folders: ContextFolder[] = [];
		for (const type of types) {
			for (const name of subdomains[type] ?? []) {
				const folder = boundedContexts[name];
				if (folder === undefined) {
					throw new Error(`subdomains names ${name}, which boundedContexts does not declare.`);
				}
				const already = classified.get(name);
				if (already !== undefined) {
					throw new Error(`subdomains lists ${name} as ${already} and as ${type}: a bounded context implements one subdomain.`);
				}
				classified.set(name, type);
				folders.push({ dir: resolve(this.rootDir, folder), isSharedKernel: false, name, subdomain: type });
			}
		}
		const unclassified = Object.keys(boundedContexts).filter((name) => !classified.has(name));
		if (unclassified.length > 0) {
			throw new Error(`boundedContexts declares ${unclassified.join(", ")}, which subdomains does not classify: list each context under subdomains.core, subdomains.supporting or subdomains.generic.`);
		}
		return folders;
	}

	private validContextMap(relations: ContextMapConfig, contexts: readonly string[]): ContextMap {
		const upstreams: Record<string, readonly string[]> = {};
		for (const [name, { consumes }] of Object.entries(relations)) {
			upstreams[name] = consumes;
		}
		const map = new ContextMap(upstreams);
		const named = new Set([...map.contexts, ...map.consumed]);
		const unknown = [...named].filter((name) => !contexts.includes(name));
		if (unknown.length > 0) {
			throw new Error(`contextMap names ${unknown.join(", ")}, which boundedContexts does not declare.`);
		}
		const unlisted = contexts.filter((name) => !map.contexts.includes(name));
		if (unlisted.length > 0) {
			throw new Error(`contextMap does not list ${unlisted.join(", ")}: every bounded context lists the contexts it consumes, consumes: [] when none.`);
		}
		const selfConsumers = map.selfConsumers();
		if (selfConsumers.length > 0) {
			throw new Error(`contextMap lists ${selfConsumers.join(", ")} as consuming itself: a context consumes other contexts only.`);
		}
		const cycle = map.cycle();
		if (cycle !== undefined) {
			throw new Error(`contextMap has a cycle: ${cycle.join(" → ")}. Two contexts that depend on each other can no longer change alone: reverse one dependency.`);
		}
		return map;
	}

	public isIgnored(path: string): boolean {
		const projectPath = relative(this.projectDir, path).split(sep).join("/");
		return this.ignored.some((glob) => matchesGlob(projectPath, glob));
	}

	public readsWiring(path: string): boolean {
		const location = this.layout.locate(path);
		return location.isAtRoot || location.isCompositionRoot;
	}

	public severityOf(rule: RuleId): Severity | "off" {
		return this.rules?.[rule] ?? "error";
	}
}
