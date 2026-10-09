import type { Architecture } from "../../architecture/index.ts";
import { ContextMap } from "../../architecture/index.ts";
import type { Dependency, SourceFile } from "../../model/index.ts";
import type { Finding, RuleMeta } from "../framework/index.ts";
import { Rule } from "../framework/index.ts";

type MessageId = "unmapped" | "cycle";

interface Consumption {
	readonly file: SourceFile;
	readonly dependency: Dependency;
	readonly from: string;
	readonly to: string;
}

export class NoUnmappedContextRule extends Rule<"strategic/no-unmapped-context", MessageId> {
	public readonly meta: RuleMeta<"strategic/no-unmapped-context", MessageId> = {
		contexts: "every",
		description: "A bounded context consuming one the context map does not allow, or two contexts that depend on each other.",
		id: "strategic/no-unmapped-context",
		messages: {
			cycle: "{from} consumes {to}, which consumes {from} back: two contexts that depend on each other can no longer change alone; declare a contextMap and reverse one dependency.",
			unmapped: "{from} consumes {to}, which the context map does not allow: add {to} to contextMap.{from}, or reverse the dependency.",
		},
	};

	public check(architecture: Architecture): Finding<MessageId>[] {
		const consumptions = this.consumptionsIn(architecture);
		const declared = architecture.contextMap;
		const findings: Finding<MessageId>[] = [];
		if (declared !== undefined) {
			for (const consumption of consumptions) {
				if (!declared.allows(consumption.from, consumption.to)) {
					findings.push(this.consumptionFinding(consumption, "unmapped"));
				}
			}
			return findings;
		}
		const observed = ContextMap.ofEdges(consumptions);
		for (const consumption of consumptions) {
			if (observed.cycleThrough(consumption.from, consumption.to)) {
				findings.push(this.consumptionFinding(consumption, "cycle"));
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

	private consumptionFinding(consumption: Consumption, messageId: MessageId): Finding<MessageId> {
		const { dependency, file, from, to } = consumption;
		return this.finding(file, dependency.line, dependency.label, messageId, { from, to });
	}
}
