import type { Architecture } from "../../../architecture/index.ts";
import type { Layer } from "../../../conventions/index.ts";
import type { Member, SourceFile } from "../../../model/index.ts";
import type { Finding, RuleMeta } from "../../framework/index.ts";
import { Rule } from "../../framework/index.ts";

type MessageId = "noResult" | "setter" | "thrown" | "rejected";

/** Methods that answer equality, storage or a JavaScript protocol, not a business operation; a `[Symbol.…]` method counts too. */
const exempt: ReadonlySet<string> = new Set(["equals", "toSnapshot", "toString", "toJSON", "valueOf"]);

/** Adapters may still throw: a lost connection is no business failure. */
const guarded: ReadonlySet<Layer | undefined> = new Set<Layer>(["domain", "application"]);

export class NoThrownFailureRule extends Rule<"tactical/no-thrown-failure", MessageId> {
	public readonly meta: RuleMeta<"tactical/no-thrown-failure", MessageId> = {
		description: "A business failure thrown instead of returned, an entity method without a Result, a setter.",
		id: "tactical/no-thrown-failure",
		messages: {
			noResult: "{member} must return a Result: expose reads as getters and return business failures as values.",
			rejected: "A failure is rejected: return it in a Result instead.",
			setter: "{member} is a setter: change the state through a business method that returns a Result.",
			thrown: "A failure is thrown: return it in a Result instead.",
		},
	};

	public check(architecture: Architecture): Finding<MessageId>[] {
		const findings: Finding<MessageId>[] = [];
		for (const file of architecture.files) {
			findings.push(...this.operationsWithoutResult(file, architecture));
			if (guarded.has(architecture.locationOf(file).layer)) {
				findings.push(...this.raisedFailures(file));
			}
		}
		return findings;
	}

	/** The public operations of an entity: methods and callable fields return a `Result`, and no setter changes state. */
	private operationsWithoutResult(file: SourceFile, architecture: Architecture): Finding<MessageId>[] {
		const findings: Finding<MessageId>[] = [];
		for (const codeClass of file.classes) {
			if (!architecture.is(codeClass, "Entity")) {
				continue;
			}
			for (const member of codeClass.members) {
				const messageId = this.messageFor(member, architecture);
				if (messageId !== undefined) {
					const symbol = `${codeClass.name}.${member.name}`;
					findings.push(this.finding(file, member.line, symbol, messageId, { member: symbol }));
				}
			}
		}
		return findings;
	}

	private messageFor(member: Member, architecture: Architecture): MessageId | undefined {
		if (!member.isPublicInstance || exempt.has(member.name) || member.name.startsWith("[")) {
			return undefined;
		}
		if (member.kind === "setter") {
			return "setter";
		}
		const isOperation = member.kind === "method" || (member.kind === "field" && member.isCallable);
		return isOperation && !architecture.returnsResult(member) ? "noResult" : undefined;
	}

	private raisedFailures(file: SourceFile): Finding<MessageId>[] {
		const findings: Finding<MessageId>[] = [];
		for (const thrown of file.throws) {
			findings.push(this.finding(file, thrown.line, thrown.form, thrown.form === "throw" ? "thrown" : "rejected"));
		}
		return findings;
	}
}
