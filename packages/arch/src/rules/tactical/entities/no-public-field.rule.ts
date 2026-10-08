import type { Architecture } from "../../../architecture/index.ts";
import type { CoreKind } from "../../../conventions/index.ts";
import type { ClassDeclaration, SourceFile } from "../../../model/index.ts";
import type { Finding, RuleMeta } from "../../framework/index.ts";
import { ClassRule } from "../../framework/index.ts";

const guarded: readonly CoreKind[] = ["Entity", "ValueObject", "Identifier"];

export class NoPublicFieldRule extends ClassRule<"tactical/no-public-field", "publicField"> {
	public readonly meta: RuleMeta<"tactical/no-public-field", "publicField"> = {
		description: "A public field on an aggregate, an entity, a value object or an identifier.",
		id: "tactical/no-public-field",
		messages: {
			publicField: "{member} is a public field: keep the state private, and expose what callers need through a getter.",
		},
	};

	protected findingsFor(codeClass: ClassDeclaration, file: SourceFile, architecture: Architecture): Finding<"publicField">[] {
		if (!guarded.some((kind) => architecture.is(codeClass, kind))) {
			return [];
		}
		const findings: Finding<"publicField">[] = [];
		for (const member of codeClass.members) {
			if (member.isField && member.visibility === "public" && !member.isStatic) {
				const symbol = `${codeClass.name}.${member.name}`;
				findings.push(this.finding(file, member.line, symbol, "publicField", { member: symbol }));
			}
		}
		return findings;
	}
}
