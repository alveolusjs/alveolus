import type { PackageDependencies, Subdomains } from "../architecture/index.ts";
import type { RuleId } from "../rules/index.ts";

export type RuleSetting = "error" | "warn" | "info" | "off";

export type ContextMapConfig = Readonly<Record<string, { readonly consumes: readonly string[] }>>;

interface LayoutConfig {
	readonly extraFolders?: Readonly<Partial<Record<"domain" | "application", readonly string[]>>>;
}

export interface AlveolusConfig {
	readonly root: string;
	readonly tsconfig?: string;
	readonly boundedContexts: Readonly<Record<string, string>>;
	readonly sharedKernel?: string;
	readonly subdomains?: Subdomains;
	readonly contextMap: ContextMapConfig;
	readonly compositionRoot?: string;
	readonly domainDependencies?: PackageDependencies;
	readonly applicationDependencies?: PackageDependencies;
	readonly ignore?: readonly string[];
	readonly layout?: LayoutConfig;
	readonly rules?: Readonly<Partial<Record<RuleId, RuleSetting>>>;
}
