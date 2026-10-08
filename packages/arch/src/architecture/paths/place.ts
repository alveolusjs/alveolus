import type { Layer, PlaceSpec } from "../../conventions/index.ts";
import type { Location } from "./location.ts";

/** Where a class belongs: a layer, and optionally a folder and a file suffix. */
export class Place {
	public readonly layer: Layer;
	public readonly folder: string | undefined;
	public readonly suffix: string | undefined;

	public constructor(spec: PlaceSpec) {
		this.layer = spec.layer;
		this.folder = spec.folder;
		this.suffix = spec.suffix;
	}

	public fits(location: Location): boolean {
		if (!location.isInBoundedContext && !location.isInSharedKernel) {
			return false;
		}
		if (location.layer !== this.layer) {
			return false;
		}
		if (this.folder !== undefined && location.folder !== this.folder) {
			return false;
		}
		return this.suffix === undefined || location.fileName.endsWith(this.suffix);
	}
}
