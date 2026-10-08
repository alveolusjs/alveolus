import type { Architecture, Location, Place } from "../../architecture/index.ts";
import type { DependencyTarget } from "../../model/index.ts";

type FileTarget = Extract<DependencyTarget, { kind: "file" }>;

/** How rules name places and locations in their messages. */
export class Wording {
	/** `src/ordering/driven/pg/adapters/pg-orders.adapter.ts (ordering driven)` */
	public target(target: FileTarget, architecture: Architecture): string {
		return `${architecture.relativePath(target.path)} (${this.location(architecture.locationOfTarget(target))})`;
	}

	public location(location: Location): string {
		if (location.unseen === "ignored") {
			return "ignored by the analysis";
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

	/** `domain/aggregates/*.aggregate.ts` */
	public place(place: Place): string {
		return place.folder === undefined ? `${place.layer}/` : `${place.layer}/${place.folder}/*${place.suffix ?? ".ts"}`;
	}
}
