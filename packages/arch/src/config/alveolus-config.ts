export type RuleId =
	| "strategic/no-cross-context-import"
	| "layers/no-impure-domain"
	| "layers/no-outward-import"
	| "layers/no-portless-adapter"
	| "tactical/no-aggregate-reference"
	| "tactical/no-query-in-command"
	| "tactical/no-command-in-query"
	| "tactical/no-thrown-failure"
	| "tactical/no-misplaced-class"
	| "tactical/no-plain-class";

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
