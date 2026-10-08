import type { BuildingBlocks } from "../building-blocks.ts";
import type { Location } from "./location.ts";

/** How a file breaks the folders its layer expects; each kind names the message a rule gives. */
export type ShapeIssue =
	| { readonly kind: "directlyInLayer" | "tooDeep"; readonly layer: "domain" | "application"; readonly example: string }
	| { readonly kind: "unknownFolder"; readonly layer: "domain" | "application"; readonly folder: string; readonly folders: readonly string[] }
	| { readonly kind: "nestedPublishedLanguage" | "drivenWithoutTechnology" | "drivenTooDeep" | "drivingWithoutTechnology" };

/** The folders each layer expects between itself and a file, as the project layout describes them. */
export class LayerShape {
	public constructor(private readonly blocks: BuildingBlocks) {}

	public issueWith(location: Location): ShapeIssue | undefined {
		const layer = location.layer;
		const folders = location.foldersInLayer;
		if (layer === "domain" || layer === "application") {
			return this.kindFolderIssue(layer, folders);
		}
		if (layer === "published-language" && folders.length > 0) {
			return { kind: "nestedPublishedLanguage" };
		}
		if (layer === "driven" && folders.length < 2) {
			return { kind: "drivenWithoutTechnology" };
		}
		if (layer === "driven" && folders.length > 2) {
			return { kind: "drivenTooDeep" };
		}
		if (layer === "driving" && folders.length === 0) {
			return { kind: "drivingWithoutTechnology" };
		}
		return undefined;
	}

	/** The domain and the application hold exactly one folder per kind of building block. */
	private kindFolderIssue(layer: "domain" | "application", folders: readonly string[]): ShapeIssue | undefined {
		const expected = this.blocks.foldersOf(layer);
		const example = `${layer}/${expected[0]}/`;
		if (folders.length === 0) {
			return { example, kind: "directlyInLayer", layer };
		}
		if (folders.length > 1) {
			return { example, kind: "tooDeep", layer };
		}
		const [folder] = folders;
		if (folder !== undefined && !expected.includes(folder)) {
			return { folder, folders: expected, kind: "unknownFolder", layer };
		}
		return undefined;
	}
}
