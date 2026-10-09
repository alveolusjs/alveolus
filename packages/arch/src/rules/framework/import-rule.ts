import type { Architecture } from "../../architecture/index.ts";
import type { Dependency, SourceFile } from "../../model/index.ts";
import type { Finding } from "./finding.ts";
import { Rule } from "./rule.ts";

export abstract class ImportRule<Id extends string = string, MessageId extends string = string> extends Rule<Id, MessageId> {
	public check(architecture: Architecture): Finding<MessageId>[] {
		const findings: Finding<MessageId>[] = [];
		for (const file of this.filesOf(architecture)) {
			if (!this.appliesTo(file, architecture)) {
				continue;
			}
			for (const dependency of file.dependencies) {
				const finding = this.findingFor(dependency, file, architecture);
				if (finding !== undefined) {
					findings.push(finding);
				}
			}
		}
		return findings;
	}

	protected abstract appliesTo(file: SourceFile, architecture: Architecture): boolean;

	protected abstract findingFor(dependency: Dependency, file: SourceFile, architecture: Architecture): Finding<MessageId> | undefined;
}
