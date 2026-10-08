import type { Codebase, CodeFile, GlobalUse, Import, Location } from "../../codebase/index.ts";
import { CoreApi } from "../../codebase/index.ts";
import type { RuleId } from "../../config/index.ts";
import { ImportRule } from "../import-rule.ts";
import type { Violation } from "../violation.ts";

export class NoImpureDomainRule extends ImportRule {
	public readonly id: RuleId = "layers/no-impure-domain";

	public override check(codebase: Codebase): Violation[] {
		return [...super.check(codebase), ...this.impureGlobals(codebase)];
	}

	protected appliesTo(file: CodeFile): boolean {
		return file.location.layer === "domain";
	}

	protected problemWith(imported: Import, file: CodeFile, codebase: Codebase): string | undefined {
		const target = imported.target;

		if (target.kind === "file") {
			if (this.isDomainReachableFrom(target.location, file.location)) {
				return undefined;
			}
			return `The domain imports ${this.describeTarget(imported, codebase)}: it may only import the domain.`;
		}

		if (target.name === CoreApi.packageName) {
			const forbidden = imported.names.filter((name) => !CoreApi.isDomainSymbol(name));
			if (forbidden.length === 0) {
				return undefined;
			}
			return `The domain imports ${forbidden.join(", ")} from ${CoreApi.packageName}: only domain building blocks and Result are allowed.`;
		}

		const allowed = codebase.config.domainDependencies;
		if (!allowed.has(target.name)) {
			return `The domain imports ${target.name}: add it to domainDependencies if the domain really needs it.`;
		}
		const forbidden = allowed.forbiddenNames(target.name, imported.names);
		if (forbidden.length === 0) {
			return undefined;
		}
		return `The domain imports ${forbidden.join(", ")} from ${target.name}: domainDependencies only allows ${allowed.allowedNames(target.name).join(", ")}.`;
	}

	private impureGlobals(codebase: Codebase): Violation[] {
		const violations: Violation[] = [];
		for (const file of codebase.files) {
			if (!this.appliesTo(file)) {
				continue;
			}
			for (const use of file.globals) {
				const message = this.globalProblem(use);
				if (message !== undefined) {
					violations.push(this.violation(codebase, file, { line: use.line, message, symbol: use.name }));
				}
			}
		}
		return violations;
	}

	private globalProblem(use: GlobalUse): string | undefined {
		if (use.origin === "host") {
			return `The domain uses ${use.name}, a global of the host: reach it through a port.`;
		}
		if (use.effect === "clock") {
			return `The domain reads the system clock with ${use.name}: receive the time from the Clock port.`;
		}
		if (use.effect === "randomness") {
			return `The domain draws a random value with ${use.name}: receive it from a port, such as IdGenerator.`;
		}
		return undefined;
	}

	private isDomainReachableFrom(to: Location, from: Location): boolean {
		return to.layer === "domain" && (to.isSameContextAs(from) || to.isInSharedKernel);
	}
}
