import { NoImpureDomainRule } from "./layers/no-impure-domain.rule.ts";
import { NoOutwardImportRule } from "./layers/no-outward-import.rule.ts";
import { NoPortlessAdapterRule } from "./layers/no-portless-adapter.rule.ts";
import type { Rule } from "./rule.ts";
import { NoCrossContextImportRule } from "./strategic/no-cross-context-import.rule.ts";
import { NoQueryInCommandRule } from "./tactical/application/command-handlers/no-query-in-command.rule.ts";
import { NoCommandInQueryRule } from "./tactical/application/query-handlers/no-command-in-query.rule.ts";
import { NoMisplacedClassRule } from "./tactical/building-blocks/no-misplaced-class.rule.ts";
import { NoPlainClassRule } from "./tactical/building-blocks/no-plain-class.rule.ts";
import { NoAggregateReferenceRule } from "./tactical/domain/aggregates/no-aggregate-reference.rule.ts";
import { NoThrownFailureRule } from "./tactical/domain/domain-errors/no-thrown-failure.rule.ts";

export class Rules {
	public static all(): Rule[] {
		return [
			new NoCrossContextImportRule(),
			new NoImpureDomainRule(),
			new NoOutwardImportRule(),
			new NoPortlessAdapterRule(),
			new NoAggregateReferenceRule(),
			new NoQueryInCommandRule(),
			new NoCommandInQueryRule(),
			new NoThrownFailureRule(),
			new NoMisplacedClassRule(),
			new NoPlainClassRule(),
		];
	}
}
