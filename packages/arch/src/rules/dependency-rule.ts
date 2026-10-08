import type { CodeClass, CoreKind, TypeUsage } from "../codebase/index.ts";
import { ClassRule } from "./class-rule.ts";
import type { Problem } from "./problem.ts";

/** Checks what a building block holds against the list of what it may hold: anything else from the project is reported. */
export abstract class DependencyRule extends ClassRule {
	/** The building block whose fields and constructor parameters are checked. */
	protected abstract readonly holder: CoreKind;

	/** Reported even when it also extends an allowed kind: a `QueryRepository` is a `Port` too. */
	protected abstract readonly forbidden: readonly CoreKind[];

	protected abstract readonly allowed: readonly CoreKind[];

	protected problemsWith(codeClass: CodeClass): Problem[] {
		if (!codeClass.is(this.holder)) {
			return [];
		}
		const problems: Problem[] = [];
		for (const member of codeClass.members) {
			if (!this.accepts(member)) {
				problems.push({ line: member.line, message: this.messageFor(codeClass, member, this.describeKind(member)), symbol: `${codeClass.name}.${member.member}` });
			}
		}
		return problems;
	}

	protected abstract messageFor(codeClass: CodeClass, member: TypeUsage, kind: string): string;

	/** A class of an installed package that is no building block is governed by the allowed dependencies, not by this rule. */
	private accepts(member: TypeUsage): boolean {
		if (this.forbidden.some((kind) => member.is(kind))) {
			return false;
		}
		if (this.allowed.some((kind) => member.is(kind))) {
			return true;
		}
		return member.isFromPackage && member.kind === undefined;
	}

	private describeKind(member: TypeUsage): string {
		const kind = member.kind;
		if (kind === undefined) {
			return "a class that extends no building block";
		}
		const article = /^[AEIO]/.test(kind) ? "an" : "a";
		return `${article} ${kind}`;
	}
}
