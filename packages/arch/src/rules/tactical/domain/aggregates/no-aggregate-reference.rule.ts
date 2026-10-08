import type { Codebase, CodeClass, CodeFile, CoreKind, TypeUsage } from "../../../../codebase/index.ts";
import type { RuleId } from "../../../../config/index.ts";
import { ClassRule } from "../../../class-rule.ts";
import type { Problem } from "../../../problem.ts";
import type { Violation } from "../../../violation.ts";

/** An entity that an aggregate holds, directly or through its entities and value objects. */
interface Holding {
	readonly aggregate: CodeClass;
	readonly file: CodeFile;
	readonly member: TypeUsage;
	readonly entity: TypeUsage;
}

const holders: readonly CoreKind[] = ["Entity", "ValueObject", "DomainEvent"];

export class NoAggregateReferenceRule extends ClassRule {
	public readonly id: RuleId = "tactical/no-aggregate-reference";

	public override check(codebase: Codebase): Violation[] {
		return [...super.check(codebase), ...this.sharedEntities(codebase)];
	}

	protected problemsWith(codeClass: CodeClass): Problem[] {
		if (!holders.some((kind) => codeClass.is(kind))) {
			return [];
		}
		const problems: Problem[] = [];
		for (const member of codeClass.members) {
			if (member.is("AggregateRoot")) {
				problems.push({
					line: member.line,
					message: `${codeClass.name}.${member.member} holds the aggregate ${member.typeName}: reference it by its identifier instead.`,
					symbol: `${codeClass.name}.${member.member}`,
				});
			}
		}
		for (const argument of codeClass.typeArguments) {
			if (argument.is("AggregateRoot")) {
				problems.push({
					line: argument.line,
					message: `${codeClass.name} holds the aggregate ${argument.typeName} in its ${argument.member}: reference it by its identifier instead.`,
					symbol: `${codeClass.name}.${argument.member}`,
				});
			}
		}
		return problems;
	}

	private sharedEntities(codebase: Codebase): Violation[] {
		const holdings = this.holdingsIn(codebase);
		const violations: Violation[] = [];
		for (const holding of holdings) {
			const others = this.otherOwners(holding, holdings);
			if (others.length > 0) {
				const verb = others.length === 1 ? "holds" : "hold";
				violations.push(
					this.violation(codebase, holding.file, {
						line: holding.member.line,
						message: `${holding.aggregate.name}.${holding.member.member} holds the entity ${holding.entity.typeName}, which ${others.join(" and ")} ${verb} too: an entity belongs to one aggregate.`,
						symbol: `${holding.aggregate.name}.${holding.member.member}`,
					}),
				);
			}
		}
		return violations;
	}

	private otherOwners(holding: Holding, holdings: readonly Holding[]): string[] {
		const others = new Set<string>();
		for (const other of holdings) {
			if (other.aggregate !== holding.aggregate && this.keyOf(other.entity) === this.keyOf(holding.entity)) {
				others.add(other.aggregate.name);
			}
		}
		return [...others].sort();
	}

	private holdingsIn(codebase: Codebase): Holding[] {
		const holdings: Holding[] = [];
		for (const file of codebase.files) {
			for (const aggregate of file.classes.filter((candidate) => candidate.is("AggregateRoot"))) {
				const visited = new Set<string>();
				for (const member of this.heldBy(aggregate)) {
					for (const entity of this.entitiesReachedFrom(member, codebase, visited)) {
						holdings.push({ aggregate, entity, file, member });
					}
				}
			}
		}
		return holdings;
	}

	/** The entities other than roots reached from a member, going through the entities and value objects it holds. */
	private entitiesReachedFrom(usage: TypeUsage, codebase: Codebase, visited: Set<string>): TypeUsage[] {
		const key = this.keyOf(usage);
		if (usage.is("AggregateRoot") || visited.has(key)) {
			return [];
		}
		visited.add(key);

		const reached = usage.is("Entity") ? [usage] : [];
		const held = this.classOf(usage, codebase);
		if (held === undefined || !(usage.is("Entity") || usage.is("ValueObject"))) {
			return reached;
		}
		for (const member of this.heldBy(held)) {
			reached.push(...this.entitiesReachedFrom(member, codebase, visited));
		}
		return reached;
	}

	private heldBy(codeClass: CodeClass): TypeUsage[] {
		return [...codeClass.members, ...codeClass.typeArguments];
	}

	private classOf(usage: TypeUsage, codebase: Codebase): CodeClass | undefined {
		if (usage.declaredIn === undefined) {
			return undefined;
		}
		return codebase.file(usage.declaredIn)?.classes.find((candidate) => candidate.name === usage.typeName);
	}

	private keyOf(usage: TypeUsage): string {
		return `${usage.declaredIn ?? ""}#${usage.typeName}`;
	}
}
