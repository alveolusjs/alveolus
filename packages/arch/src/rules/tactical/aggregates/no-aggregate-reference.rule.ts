import type { Architecture } from "../../../architecture/index.ts";
import type { CoreKind } from "../../../conventions/index.ts";
import type { ClassDeclaration, ClassType, SourceFile } from "../../../model/index.ts";
import type { Finding, RuleMeta } from "../../framework/index.ts";
import { Rule } from "../../framework/index.ts";

type MessageId = "heldAggregate" | "aggregateInTypeArgument" | "sharedEntity";

/** Something a class holds: a member, or a type argument given to the class it extends. */
interface Held {
	readonly name: string;
	readonly line: number;
	readonly types: readonly ClassType[];
}

/** An entity that an aggregate holds, directly or through its entities and value objects. */
interface Holding {
	readonly aggregate: ClassDeclaration;
	readonly file: SourceFile;
	readonly through: Held;
	readonly entity: ClassType;
}

/** The building blocks that may not hold an aggregate: an aggregate is an entity, so it is one of them. */
const holders: readonly CoreKind[] = ["Entity", "ValueObject", "DomainEvent"];

export class NoAggregateReferenceRule extends Rule<"tactical/no-aggregate-reference", MessageId> {
	public readonly meta: RuleMeta<"tactical/no-aggregate-reference", MessageId> = {
		description: "An aggregate holding another aggregate instead of its identifier, an entity held by two aggregates.",
		id: "tactical/no-aggregate-reference",
		messages: {
			aggregateInTypeArgument: "{class} holds the aggregate {type} in its {parameter}: reference it by its identifier instead.",
			heldAggregate: "{member} holds the aggregate {type}: reference it by its identifier instead.",
			sharedEntity: "{member} holds the entity {entity}, which {others} {verb} too: an entity belongs to one aggregate.",
		},
	};

	public check(architecture: Architecture): Finding<MessageId>[] {
		const findings: Finding<MessageId>[] = [];
		for (const file of architecture.files) {
			for (const codeClass of file.classes) {
				findings.push(...this.heldAggregates(codeClass, file, architecture));
			}
		}
		findings.push(...this.sharedEntities(architecture));
		return findings;
	}

	/** An entity, a value object or a domain event holds no aggregate, in a member or in the props it gives its base class. */
	private heldAggregates(codeClass: ClassDeclaration, file: SourceFile, architecture: Architecture): Finding<MessageId>[] {
		if (!holders.some((kind) => architecture.is(codeClass, kind))) {
			return [];
		}
		const findings: Finding<MessageId>[] = [];
		for (const member of codeClass.heldMembers) {
			for (const type of member.valueTypes) {
				if (architecture.is(type, "AggregateRoot")) {
					const symbol = `${codeClass.name}.${member.name}`;
					findings.push(this.finding(file, member.line, symbol, "heldAggregate", { member: symbol, type: type.name }));
				}
			}
		}
		for (const argument of codeClass.typeArguments) {
			for (const type of argument.types) {
				if (architecture.is(type, "AggregateRoot")) {
					const data = { class: codeClass.name, parameter: argument.parameter, type: type.name };
					findings.push(this.finding(file, argument.line, `${codeClass.name}.${argument.parameter}`, "aggregateInTypeArgument", data));
				}
			}
		}
		return findings;
	}

	/** An entity other than a root belongs to one aggregate: one held by two is reported at each of them. */
	private sharedEntities(architecture: Architecture): Finding<MessageId>[] {
		const holdings = this.holdingsIn(architecture);
		const findings: Finding<MessageId>[] = [];
		for (const holding of holdings) {
			const others = this.otherOwners(holding, holdings);
			if (others.length > 0) {
				const symbol = `${holding.aggregate.name}.${holding.through.name}`;
				const data = { entity: holding.entity.name, member: symbol, others: others.join(" and "), verb: others.length === 1 ? "holds" : "hold" };
				findings.push(this.finding(holding.file, holding.through.line, symbol, "sharedEntity", data));
			}
		}
		return findings;
	}

	private otherOwners(holding: Holding, holdings: readonly Holding[]): string[] {
		const others = new Set<string>();
		for (const other of holdings) {
			if (other.aggregate !== holding.aggregate && other.entity.key === holding.entity.key) {
				others.add(other.aggregate.name);
			}
		}
		return [...others].sort();
	}

	private holdingsIn(architecture: Architecture): Holding[] {
		const holdings: Holding[] = [];
		for (const file of architecture.files) {
			for (const aggregate of file.classes) {
				if (!architecture.is(aggregate, "AggregateRoot")) {
					continue;
				}
				const visited = new Set<string>();
				for (const through of this.heldBy(aggregate)) {
					for (const type of through.types) {
						for (const entity of this.entitiesReachedFrom(type, architecture, visited)) {
							holdings.push({ aggregate, entity, file, through });
						}
					}
				}
			}
		}
		return holdings;
	}

	/** The entities other than roots reached from a type, going through the entities and value objects it holds. */
	private entitiesReachedFrom(type: ClassType, architecture: Architecture, visited: Set<string>): ClassType[] {
		if (architecture.is(type, "AggregateRoot") || visited.has(type.key)) {
			return [];
		}
		visited.add(type.key);

		const isEntity = architecture.is(type, "Entity");
		const reached = isEntity ? [type] : [];
		const declaration = architecture.classOf(type);
		if (declaration === undefined || !(isEntity || architecture.is(type, "ValueObject"))) {
			return reached;
		}
		for (const held of this.heldBy(declaration)) {
			for (const inner of held.types) {
				reached.push(...this.entitiesReachedFrom(inner, architecture, visited));
			}
		}
		return reached;
	}

	private heldBy(codeClass: ClassDeclaration): Held[] {
		const held: Held[] = codeClass.heldMembers.map((member) => ({ line: member.line, name: member.name, types: member.valueTypes }));
		for (const argument of codeClass.typeArguments) {
			held.push({ line: argument.line, name: argument.parameter, types: argument.types });
		}
		return held;
	}
}
