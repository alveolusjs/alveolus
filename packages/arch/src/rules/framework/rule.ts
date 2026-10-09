import type { Architecture } from "../../architecture/index.ts";
import type { SourceFile } from "../../model/index.ts";
import type { Finding, FindingData } from "./finding.ts";
import { Wording } from "./wording.ts";

type RuleContexts = "every" | "core";

export interface RuleMeta<Id extends string, MessageId extends string> {
	readonly id: Id;
	readonly contexts: RuleContexts;
	readonly description: string;
	readonly messages: Readonly<Record<MessageId, string>>;
}

export abstract class Rule<Id extends string = string, MessageId extends string = string> {
	public abstract readonly meta: RuleMeta<Id, MessageId>;

	protected readonly wording: Wording = new Wording();

	public abstract check(architecture: Architecture): Finding<MessageId>[];

	protected filesOf(architecture: Architecture): SourceFile[] {
		const files: SourceFile[] = [];
		for (const file of architecture.files) {
			if (this.checks(file, architecture)) {
				files.push(file);
			}
		}
		return files;
	}

	private checks(file: SourceFile, architecture: Architecture): boolean {
		if (this.meta.contexts === "every") {
			return true;
		}
		const location = architecture.locationOf(file);
		return !location.isInBoundedContext || location.isInCoreDomain;
	}

	protected finding(file: SourceFile, line: number, symbol: string, messageId: MessageId, data: FindingData = {}): Finding<MessageId> {
		return { data, file, line, messageId, symbol };
	}
}
