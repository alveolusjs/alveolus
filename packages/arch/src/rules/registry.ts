import type { Rule } from "./framework/index.ts";
import { NoImpureDomainRule } from "./layers/no-impure-domain.rule.ts";
import { NoOutwardImportRule } from "./layers/no-outward-import.rule.ts";
import { NoPortlessAdapterRule } from "./layers/no-portless-adapter.rule.ts";
import { NoCrossContextImportRule } from "./strategic/no-cross-context-import.rule.ts";
import { NoLeakyHostServiceRule } from "./strategic/no-leaky-host-service.rule.ts";
import { NoAggregateReferenceRule } from "./tactical/aggregates/no-aggregate-reference.rule.ts";
import { NoLooseCodeRule } from "./tactical/building-blocks/no-loose-code.rule.ts";
import { NoMisplacedClassRule } from "./tactical/building-blocks/no-misplaced-class.rule.ts";
import { NoForeignCommandDependencyRule } from "./tactical/command-handlers/no-foreign-command-dependency.rule.ts";
import { NoThrownFailureRule } from "./tactical/domain-errors/no-thrown-failure.rule.ts";
import { NoStatefulServiceRule } from "./tactical/domain-services/no-stateful-service.rule.ts";
import { NoForeignQueryDependencyRule } from "./tactical/query-handlers/no-foreign-query-dependency.rule.ts";

/** Every rule, by id, in the order the rules run. The type of a rule id derives from this list. */
export const ruleIds = [
	"strategic/no-cross-context-import",
	"strategic/no-leaky-host-service",
	"layers/no-impure-domain",
	"layers/no-outward-import",
	"layers/no-portless-adapter",
	"tactical/no-aggregate-reference",
	"tactical/no-foreign-command-dependency",
	"tactical/no-foreign-query-dependency",
	"tactical/no-stateful-service",
	"tactical/no-thrown-failure",
	"tactical/no-misplaced-class",
	"tactical/no-loose-code",
] as const;

export type RuleId = (typeof ruleIds)[number];

/** The rules themselves: one instance per id above, in the same order. A rule whose id is not in the list does not compile. */
export class RuleRegistry {
	public readonly rules: readonly Rule<RuleId>[] = [
		new NoCrossContextImportRule(),
		new NoLeakyHostServiceRule(),
		new NoImpureDomainRule(),
		new NoOutwardImportRule(),
		new NoPortlessAdapterRule(),
		new NoAggregateReferenceRule(),
		new NoForeignCommandDependencyRule(),
		new NoForeignQueryDependencyRule(),
		new NoStatefulServiceRule(),
		new NoThrownFailureRule(),
		new NoMisplacedClassRule(),
		new NoLooseCodeRule(),
	];

	public get ids(): RuleId[] {
		return this.rules.map((rule) => rule.meta.id);
	}
}
