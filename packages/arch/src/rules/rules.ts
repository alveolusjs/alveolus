import { NoImpureDomainRule } from "./layers/no-impure-domain.rule.ts";
import { NoOutwardImportRule } from "./layers/no-outward-import.rule.ts";
import { NoPortlessAdapterRule } from "./layers/no-portless-adapter.rule.ts";
import type { Rule } from "./rule.ts";
import { NoCrossContextImportRule } from "./strategic/no-cross-context-import.rule.ts";
import { NoLeakyHostServiceRule } from "./strategic/no-leaky-host-service.rule.ts";
import { NoForeignCommandDependencyRule } from "./tactical/application/command-handlers/no-foreign-command-dependency.rule.ts";
import { NoForeignQueryDependencyRule } from "./tactical/application/query-handlers/no-foreign-query-dependency.rule.ts";
import { NoLooseCodeRule } from "./tactical/building-blocks/no-loose-code.rule.ts";
import { NoMisplacedClassRule } from "./tactical/building-blocks/no-misplaced-class.rule.ts";
import { NoAggregateReferenceRule } from "./tactical/domain/aggregates/no-aggregate-reference.rule.ts";
import { NoThrownFailureRule } from "./tactical/domain/domain-errors/no-thrown-failure.rule.ts";
import { NoStatefulServiceRule } from "./tactical/domain/domain-services/no-stateful-service.rule.ts";

export class Rules {
	public static all(): Rule[] {
		return [
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
	}
}
