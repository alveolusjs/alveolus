import type { Codebase, CodeClass, CodeFile, CoreKind } from "../codebase/index.ts";
import type { RuleId } from "../config/index.ts";
import { Place } from "./place.ts";
import type { Problem } from "./problem.ts";
import { Rule } from "./rule.ts";
import type { Violation } from "./violation.ts";

interface KindPlace {
	readonly kind: CoreKind;
	readonly place: Place;
	readonly concreteOnly?: boolean;
}

const repositories = new Place("domain", "repositories", ".repository.ts");

const kindPlaces: readonly KindPlace[] = [
	{ kind: "AggregateRoot", place: new Place("domain", "aggregates", ".aggregate.ts") },
	{ kind: "Entity", place: new Place("domain", "entities", ".entity.ts") },
	{ kind: "Identifier", place: new Place("domain", "value-objects", ".identifier.ts") },
	{ kind: "ValueObject", place: new Place("domain", "value-objects", ".value-object.ts") },
	{ kind: "DomainEvent", place: new Place("domain", "events", ".event.ts") },
	{ kind: "DomainError", place: new Place("domain", "errors", ".error.ts") },
	{ kind: "DomainService", place: new Place("domain", "services", ".service.ts") },
	{ kind: "CommandHandler", place: new Place("application", "commands", ".command.ts") },
	{ kind: "QueryHandler", place: new Place("application", "queries", ".query.ts") },
	{ kind: "EventTranslator", place: new Place("application", "translators", ".translator.ts") },
	{ concreteOnly: true, kind: "Port", place: new Place("driven", "adapters", ".adapter.ts") },
	{ kind: "CommandRepository", place: repositories },
	{ kind: "QueryRepository", place: repositories },
	{ kind: "Port", place: new Place("domain", "ports", ".port.ts") },
];

const markedPlace = new Place("driving");

export class PlacementRule extends Rule {
	public readonly id: RuleId = "placement";

	public check(codebase: Codebase): Violation[] {
		const violations: Violation[] = [];
		for (const file of codebase.files) {
			for (const problem of [...this.extraClasses(file), ...this.misplacedClasses(file)]) {
				violations.push(this.violation(codebase, file, problem));
			}
		}
		return violations;
	}

	private extraClasses(file: CodeFile): Problem[] {
		const [first, ...others] = file.classes;
		return others.map((codeClass) => ({ line: codeClass.line, message: `${codeClass.name} shares its file with ${first?.name}: one class per file.`, symbol: codeClass.name }));
	}

	private misplacedClasses(file: CodeFile): Problem[] {
		const problems: Problem[] = [];
		for (const codeClass of file.classes) {
			const place = this.placeOf(codeClass);
			if (place !== undefined && !place.fits(file.location)) {
				problems.push({ line: codeClass.line, message: `${codeClass.name} belongs in ${place.describe()}.`, symbol: codeClass.name });
			}
		}
		return problems;
	}

	private placeOf(codeClass: CodeClass): Place | undefined {
		const match = kindPlaces.find((entry) => codeClass.is(entry.kind) && !(entry.concreteOnly === true && codeClass.isAbstract));
		if (match !== undefined) {
			return match.place;
		}
		return codeClass.hasMarker ? markedPlace : undefined;
	}
}
