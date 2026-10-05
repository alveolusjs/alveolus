export type RuleId =
	| "bc-isolation"
	| "domain-purity"
	| "layer-direction"
	| "driven-adapters-extend-port"
	| "reference-by-identity"
	| "command-query-separation"
	| "errors-as-values"
	| "placement"
	| "building-blocks-only";

/** Each package and what may be imported from it: `true` for everything, or the allowed names. */
export type PackageDependencies = Readonly<Record<string, true | readonly string[]>>;

export type RuleSetting = "error" | "off";

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
