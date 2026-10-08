import type { Architecture } from "../../architecture/index.ts";
import type { DisableComment, SourceFile } from "../../model/index.ts";
import type { Finding, RuleMeta } from "../framework/index.ts";
import { Rule } from "../framework/index.ts";
import { DisableDirective } from "./disable-directive.ts";

type MessageId = "noRule" | "unknownRule" | "noReason" | "unused";

/** A disable comment that names no known rule, gives no reason, or disables nothing. */
export class NoLooseDisableRule extends Rule<"tooling/no-loose-disable", MessageId> {
	public readonly meta: RuleMeta<"tooling/no-loose-disable", MessageId> = {
		description: "A disable comment that names no known rule, gives no reason, or disables nothing.",
		id: "tooling/no-loose-disable",
		messages: {
			noReason: "The disable comment gives no reason: write `// alveolus-disable-next-line {rule}: <why this line keeps its violation>`.",
			noRule: "The disable comment names no rule: write `// alveolus-disable-next-line <rule-id>: <reason>`.",
			unknownRule: "The disable comment names {rule}, which is no rule: check the id on the rules page.",
			unused: "The disable comment disables nothing: the line below breaks {rule} no more; remove the comment.",
		},
	};

	public constructor(private readonly knownRules: readonly string[]) {
		super();
	}

	public check(architecture: Architecture): Finding<MessageId>[] {
		const findings: Finding<MessageId>[] = [];
		for (const file of architecture.files) {
			for (const comment of file.disables) {
				const finding = this.malformed(file, comment);
				if (finding !== undefined) {
					findings.push(finding);
				}
			}
		}
		return findings;
	}

	/** A complete comment whose next line breaks no rule: the checker finds those once the rules have run. */
	public unused(file: SourceFile, comment: DisableComment): Finding<MessageId> {
		const directive = new DisableDirective(comment.text);
		return this.finding(file, comment.line, "alveolus-disable-next-line", "unused", { rule: directive.rule ?? "" });
	}

	private malformed(file: SourceFile, comment: DisableComment): Finding<MessageId> | undefined {
		const directive = new DisableDirective(comment.text);
		if (directive.rule === undefined) {
			return this.finding(file, comment.line, "alveolus-disable-next-line", "noRule");
		}
		if (!this.knownRules.includes(directive.rule)) {
			return this.finding(file, comment.line, "alveolus-disable-next-line", "unknownRule", { rule: directive.rule });
		}
		if (directive.reason === undefined) {
			return this.finding(file, comment.line, "alveolus-disable-next-line", "noReason", { rule: directive.rule });
		}
		return undefined;
	}
}
