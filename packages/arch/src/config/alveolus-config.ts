import type { PackageDependencies } from "../architecture/index.ts";
import type { RuleId } from "../rules/index.ts";

export type RuleSetting = "error" | "off";

/** The content of `alveolus.config.ts`. */
export interface AlveolusConfig {
	readonly root: string;
	readonly boundedContexts: Readonly<Record<string, string>>;
	readonly sharedKernel?: string;
	readonly compositionRoot?: string;
	readonly domainDependencies?: PackageDependencies;
	readonly applicationDependencies?: PackageDependencies;
	readonly ignore?: readonly string[];
	readonly rules?: Readonly<Partial<Record<RuleId, RuleSetting>>>;
}
