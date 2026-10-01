import type { Layer, Location } from "../codebase/index.ts";

export class Place {
	public constructor(
		public readonly layer: Layer,
		public readonly folder?: string,
		public readonly suffix?: string,
	) {}

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

	public describe(): string {
		return this.folder === undefined ? `${this.layer}/` : `${this.layer}/${this.folder}/*${this.suffix ?? ".ts"}`;
	}
}
