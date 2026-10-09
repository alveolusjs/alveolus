import type { Architecture, Location, Place } from "../../architecture/index.ts";
import type { DependencyTarget } from "../../model/index.ts";

type FileTarget = Extract<DependencyTarget, { kind: "file" }>;

export class Wording {
	public target(target: FileTarget, architecture: Architecture): string {
		if (target.visibility === "dynamic") {
			return `code loaded at runtime with ${target.path}`;
		}
		return `${architecture.relativePath(target.path)} (${this.location(architecture.locationOfTarget(target))})`;
	}

	public location(location: Location): string {
		if (location.unseen === "ignored") {
			return "ignored by the analysis";
		}
		if (location.unseen === "dynamic") {
			return "loaded at runtime";
		}
		if (location.unseen === "unresolved") {
			return "not resolved by the analysis";
		}
		if (location.isOutside) {
			return "outside the declared bounded contexts and shared kernel";
		}
		if (location.isAtRoot) {
			return "at the root";
		}
		const role = location.isCompositionRoot ? "composition root" : (location.layer ?? "outside the layers");
		return `${location.context} ${role}`;
	}

	public place(place: Place): string {
		return place.folder === undefined ? `${place.layer}/` : `${place.layer}/${place.folder}/*${place.suffix ?? ".ts"}`;
	}
}
