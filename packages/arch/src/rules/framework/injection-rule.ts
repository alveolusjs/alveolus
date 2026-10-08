import type { Architecture } from "../../architecture/index.ts";
import type { CoreKind } from "../../conventions/index.ts";
import type { ClassDeclaration, ClassType, SourceFile } from "../../model/index.ts";
import { ClassRule } from "./class-rule.ts";
import type { Finding } from "./finding.ts";

/**
 * A rule on what a building block receives: each class its fields and constructor parameters hold is checked against a list.
 * A class of an installed package that is no building block is left to the allowed dependencies of the configuration.
 */
export abstract class InjectionRule<Id extends string = string> extends ClassRule<Id, "foreign"> {
	/** The building block whose fields and constructor parameters are checked. */
	protected abstract readonly holder: CoreKind;

	/** Reported even when it also extends an allowed kind: a `QueryRepository` is a `Port` too. */
	protected abstract readonly forbidden: readonly CoreKind[];

	protected abstract readonly allowed: readonly CoreKind[];

	protected findingsFor(codeClass: ClassDeclaration, file: SourceFile, architecture: Architecture): Finding<"foreign">[] {
		if (!architecture.is(codeClass, this.holder)) {
			return [];
		}
		const findings: Finding<"foreign">[] = [];
		for (const member of codeClass.heldMembers) {
			for (const type of member.valueTypes) {
				if (!this.accepts(type, architecture)) {
					const data = { class: codeClass.name, kind: this.describeKind(type, architecture), type: type.name };
					findings.push(this.finding(file, member.line, `${codeClass.name}.${member.name}`, "foreign", data));
				}
			}
		}
		return findings;
	}

	private accepts(type: ClassType, architecture: Architecture): boolean {
		if (this.forbidden.some((kind) => architecture.is(type, kind))) {
			return false;
		}
		if (this.allowed.some((kind) => architecture.is(type, kind))) {
			return true;
		}
		return type.isInstalled && !architecture.isBuildingBlock(type);
	}

	private describeKind(type: ClassType, architecture: Architecture): string {
		const kind = architecture.kindOf(type);
		if (kind === undefined) {
			return "a class that extends no building block";
		}
		const article = /^[AEIO]/.test(kind) ? "an" : "a";
		return `${article} ${kind}`;
	}
}
