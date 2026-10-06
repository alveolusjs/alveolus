import { NoAggregateReferenceRule } from "./no-aggregate-reference.rule.ts";
import { NoCrossContextImportRule } from "./no-cross-context-import.rule.ts";
import { NoImpureDomainRule } from "./no-impure-domain.rule.ts";
import { NoMisplacedClassRule } from "./no-misplaced-class.rule.ts";
import { NoMixedHandlerRule } from "./no-mixed-handler.rule.ts";
import { NoOutwardImportRule } from "./no-outward-import.rule.ts";
import { NoPlainClassRule } from "./no-plain-class.rule.ts";
import { NoPortlessAdapterRule } from "./no-portless-adapter.rule.ts";
import { NoThrownFailureRule } from "./no-thrown-failure.rule.ts";
import type { Rule } from "./rule.ts";

export class Rules {
	public static all(): Rule[] {
		return [
			new NoCrossContextImportRule(),
			new NoImpureDomainRule(),
			new NoOutwardImportRule(),
			new NoPortlessAdapterRule(),
			new NoAggregateReferenceRule(),
			new NoMixedHandlerRule(),
			new NoThrownFailureRule(),
			new NoMisplacedClassRule(),
			new NoPlainClassRule(),
		];
	}
}
