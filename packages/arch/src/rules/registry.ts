import type { Rule } from "./framework/index.ts";
import { NoDrivingShortcutRule } from "./layers/no-driving-shortcut.rule.ts";
import { NoImpureDomainRule } from "./layers/no-impure-domain.rule.ts";
import { NoOutwardImportRule } from "./layers/no-outward-import.rule.ts";
import { NoPortlessAdapterRule } from "./layers/no-portless-adapter.rule.ts";
import { NoCrossContextImportRule } from "./strategic/no-cross-context-import.rule.ts";
import { NoFatSharedKernelRule } from "./strategic/no-fat-shared-kernel.rule.ts";
import { NoLeakyHostServiceRule } from "./strategic/no-leaky-host-service.rule.ts";
import { NoUnmappedContextRule } from "./strategic/no-unmapped-context.rule.ts";
import { NoAggregateReferenceRule } from "./tactical/aggregates/no-aggregate-reference.rule.ts";
import { NoLooseCodeRule } from "./tactical/building-blocks/no-loose-code.rule.ts";
import { NoMisplacedClassRule } from "./tactical/building-blocks/no-misplaced-class.rule.ts";
import { NoForeignCommandDependencyRule } from "./tactical/command-handlers/no-foreign-command-dependency.rule.ts";
import { NoThrownFailureRule } from "./tactical/domain-errors/no-thrown-failure.rule.ts";
import { NoStatefulServiceRule } from "./tactical/domain-services/no-stateful-service.rule.ts";
import { NoPublicFieldRule } from "./tactical/entities/no-public-field.rule.ts";
import { NoForeignQueryDependencyRule } from "./tactical/query-handlers/no-foreign-query-dependency.rule.ts";
import { NoLooseDisableRule } from "./tooling/no-loose-disable.rule.ts";

export const ruleIds = [
	"strategic/no-cross-context-import",
	"strategic/no-leaky-host-service",
	"strategic/no-unmapped-context",
	"strategic/no-fat-shared-kernel",
	"layers/no-impure-domain",
	"layers/no-outward-import",
	"layers/no-portless-adapter",
	"layers/no-driving-shortcut",
	"tactical/no-aggregate-reference",
	"tactical/no-public-field",
	"tactical/no-foreign-command-dependency",
	"tactical/no-foreign-query-dependency",
	"tactical/no-stateful-service",
	"tactical/no-thrown-failure",
	"tactical/no-misplaced-class",
	"tactical/no-loose-code",
	"tooling/no-loose-disable",
] as const;

export type RuleId = (typeof ruleIds)[number];

export class RuleRegistry {
	public readonly rules: readonly Rule<RuleId>[] = [
		new NoCrossContextImportRule(),
		new NoLeakyHostServiceRule(),
		new NoUnmappedContextRule(),
		new NoFatSharedKernelRule(),
		new NoImpureDomainRule(),
		new NoOutwardImportRule(),
		new NoPortlessAdapterRule(),
		new NoDrivingShortcutRule(),
		new NoAggregateReferenceRule(),
		new NoPublicFieldRule(),
		new NoForeignCommandDependencyRule(),
		new NoForeignQueryDependencyRule(),
		new NoStatefulServiceRule(),
		new NoThrownFailureRule(),
		new NoMisplacedClassRule(),
		new NoLooseCodeRule(),
		new NoLooseDisableRule(ruleIds),
	];

	public get looseDisable(): NoLooseDisableRule {
		return this.rules.find((rule) => rule instanceof NoLooseDisableRule) as NoLooseDisableRule;
	}

	public get ids(): RuleId[] {
		return this.rules.map((rule) => rule.meta.id);
	}
}
