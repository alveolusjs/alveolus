import type { Architecture } from "../../architecture/index.ts";
import type { Dependency, SourceFile } from "../../model/index.ts";
import type { Finding, RuleMeta } from "../framework/index.ts";
import { Rule } from "../framework/index.ts";

type MessageId = "unmapped" | "unmappedWiring";

interface Consumption {
	readonly file: SourceFile;
	readonly dependency: Dependency;
	readonly from: string;
	readonly to: string;
}

export class NoUnmappedContextRule extends Rule<"strategic/no-unmapped-context", MessageId> {
	public readonly meta: RuleMeta<"strategic/no-unmapped-context", MessageId> = {
		contexts: "every",
		description: "A bounded context consuming one the context map does not allow, through an import or through the wiring.",
		id: "strategic/no-unmapped-context",
		messages: {
			unmapped: "{from} consumes {to}, which the context map does not allow: reverse the dependency, or if {from} really is downstream of {to}, add {to} to contextMap.{from}.consumes.",
			unmappedWiring:
				"{from} receives {expression} from {to} here, which the context map does not allow: reverse the dependency, or if {from} really is downstream of {to}, add {to} to contextMap.{from}.consumes.",
		},
	};

	public check(architecture: Architecture): Finding<MessageId>[] {
		const findings: Finding<MessageId>[] = [];
		for (const consumption of this.consumptionsIn(architecture)) {
			if (!architecture.contextMap.allows(consumption.from, consumption.to)) {
				findings.push(this.consumptionFinding(consumption));
			}
		}
		findings.push(...this.unmappedWirings(architecture));
		return findings;
	}

	private unmappedWirings(architecture: Architecture): Finding<MessageId>[] {
		const findings: Finding<MessageId>[] = [];
		for (const file of this.filesOf(architecture)) {
			for (const crossing of architecture.crossingsIn(file)) {
				if (!architecture.contextMap.allows(crossing.from, crossing.to)) {
					findings.push(this.finding(file, crossing.line, crossing.expression, "unmappedWiring", { expression: crossing.expression, from: crossing.from, to: crossing.to }));
				}
			}
		}
		return findings;
	}

	private consumptionsIn(architecture: Architecture): Consumption[] {
		const consumptions: Consumption[] = [];
		for (const file of this.filesOf(architecture)) {
			const from = architecture.locationOf(file);
			if (!from.isInBoundedContext || from.context === undefined) {
				continue;
			}
			for (const dependency of file.dependencies) {
				if (dependency.target.kind !== "file") {
					continue;
				}
				const to = architecture.locationOfTarget(dependency.target);
				if (to.isOtherBoundedContextThan(from) && to.context !== undefined) {
					consumptions.push({ dependency, file, from: from.context, to: to.context });
				}
			}
		}
		return consumptions;
	}

	private consumptionFinding(consumption: Consumption): Finding<MessageId> {
		const { dependency, file, from, to } = consumption;
		return this.finding(file, dependency.line, dependency.label, "unmapped", { from, to });
	}
}
