import { BcIsolationRule } from "./bc-isolation.rule.ts";
import { BuildingBlocksOnlyRule } from "./building-blocks-only.rule.ts";
import { CommandQuerySeparationRule } from "./command-query-separation.rule.ts";
import { DomainPurityRule } from "./domain-purity.rule.ts";
import { DrivenAdaptersExtendPortRule } from "./driven-adapters-extend-port.rule.ts";
import { ErrorsAsValuesRule } from "./errors-as-values.rule.ts";
import { LayerDirectionRule } from "./layer-direction.rule.ts";
import { PlacementRule } from "./placement.rule.ts";
import { ReferenceByIdentityRule } from "./reference-by-identity.rule.ts";
import type { Rule } from "./rule.ts";

export class Rules {
	public static all(): Rule[] {
		return [
			new BcIsolationRule(),
			new DomainPurityRule(),
			new LayerDirectionRule(),
			new DrivenAdaptersExtendPortRule(),
			new ReferenceByIdentityRule(),
			new CommandQuerySeparationRule(),
			new ErrorsAsValuesRule(),
			new PlacementRule(),
			new BuildingBlocksOnlyRule(),
		];
	}
}
