import type { Architecture } from "../../architecture/index.ts";
import type { ClassDeclaration, SourceFile } from "../../model/index.ts";
import type { Finding } from "./finding.ts";
import { Rule } from "./rule.ts";

/** A rule that looks at each class on its own. */
export abstract class ClassRule<Id extends string = string, MessageId extends string = string> extends Rule<Id, MessageId> {
	public check(architecture: Architecture): Finding<MessageId>[] {
		const findings: Finding<MessageId>[] = [];
		for (const file of architecture.files) {
			for (const codeClass of file.classes) {
				findings.push(...this.findingsFor(codeClass, file, architecture));
			}
		}
		return findings;
	}

	protected abstract findingsFor(codeClass: ClassDeclaration, file: SourceFile, architecture: Architecture): Finding<MessageId>[];
}
