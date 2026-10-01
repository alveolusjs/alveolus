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

export type RuleSetting = "error" | "off";

export interface AlveolusConfig {
	readonly root: string;
	readonly boundedContexts: Readonly<Record<string, string>>;
	readonly sharedKernel?: string;
	readonly compositionRoot?: string;
	readonly domainDependencies?: readonly string[];
	readonly ignore?: readonly string[];
	readonly rules?: Readonly<Partial<Record<RuleId, RuleSetting>>>;
}
