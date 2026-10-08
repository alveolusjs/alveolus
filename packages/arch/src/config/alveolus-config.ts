import type { PackageDependencies } from "../architecture/index.ts";
import type { RuleId } from "../rules/index.ts";

export type RuleSetting = "error" | "off";

/** The folders a project adds to the ones Alveolus expects under a layer. */
interface LayoutConfig {
	readonly extraFolders?: Readonly<Partial<Record<"domain" | "application", readonly string[]>>>;
}

/** The content of `alveolus.config.ts`. */
export interface AlveolusConfig {
	readonly root: string;
	/** The TypeScript configuration to read the sources with, `tsconfig.json` by default. */
	readonly tsconfig?: string;
	readonly boundedContexts: Readonly<Record<string, string>>;
	readonly sharedKernel?: string;
	readonly compositionRoot?: string;
	readonly domainDependencies?: PackageDependencies;
	readonly applicationDependencies?: PackageDependencies;
	readonly ignore?: readonly string[];
	readonly layout?: LayoutConfig;
	readonly rules?: Readonly<Partial<Record<RuleId, RuleSetting>>>;
}
