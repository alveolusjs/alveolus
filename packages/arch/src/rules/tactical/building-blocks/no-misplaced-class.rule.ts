import type { Architecture, Location } from "../../../architecture/index.ts";
import type { CoreMarker } from "../../../conventions/index.ts";
import type { ClassDeclaration, SourceFile } from "../../../model/index.ts";
import type { Finding, RuleMeta } from "../../framework/index.ts";
import { Rule } from "../../framework/index.ts";

type MessageId = "sharedFile" | "misplacedMarker" | "misplacedKind";

/** Where a marked class belongs, as the project layout writes it. */
const markerWording: Readonly<Record<CoreMarker, string>> = {
	AntiCorruptionLayer: "driven/<technology>/adapters/*.adapter.ts, as an adapter of a port",
	OpenHostService: "driving/<technology>/",
};

export class NoMisplacedClassRule extends Rule<"tactical/no-misplaced-class", MessageId> {
	public readonly meta: RuleMeta<"tactical/no-misplaced-class", MessageId> = {
		description: "A class in the wrong folder or file, two classes in one file.",
		id: "tactical/no-misplaced-class",
		messages: {
			misplacedKind: "{name} belongs in {place}.",
			misplacedMarker: "{name} implements {marker}: it belongs in {place}.",
			sharedFile: "{name} shares its file with {first}: one class per file.",
		},
	};

	public check(architecture: Architecture): Finding<MessageId>[] {
		const findings: Finding<MessageId>[] = [];
		for (const file of architecture.files) {
			findings.push(...this.extraClasses(file));
			const [first] = file.classes;
			const finding = first === undefined ? undefined : this.misplacement(first, file, architecture.locationOf(file), architecture);
			if (finding !== undefined) {
				findings.push(finding);
			}
		}
		return findings;
	}

	/** One class per file: every class after the first is reported, and its place is checked once it has a file of its own. */
	private extraClasses(file: SourceFile): Finding<MessageId>[] {
		const [first, ...others] = file.classes;
		const findings: Finding<MessageId>[] = [];
		for (const codeClass of others) {
			findings.push(this.finding(file, codeClass.line, codeClass.name, "sharedFile", { first: first?.name ?? "", name: codeClass.name }));
		}
		return findings;
	}

	/** A marker decides the place first; otherwise the most specific building block the class extends does. */
	private misplacement(codeClass: ClassDeclaration, file: SourceFile, location: Location, architecture: Architecture): Finding<MessageId> | undefined {
		for (const { marker, place } of architecture.blocks.markedPlacesOf(codeClass)) {
			if (!place.fits(location)) {
				return this.finding(file, codeClass.line, codeClass.name, "misplacedMarker", { marker, name: codeClass.name, place: markerWording[marker] });
			}
		}
		const place = architecture.blocks.placeOf(codeClass);
		if (place === undefined || place.fits(location)) {
			return undefined;
		}
		return this.finding(file, codeClass.line, codeClass.name, "misplacedKind", { name: codeClass.name, place: this.wording.place(place) });
	}
}
