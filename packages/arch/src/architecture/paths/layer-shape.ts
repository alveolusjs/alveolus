import type { BuildingBlocks } from "../building-blocks.ts";
import type { ExtraFolders } from "../settings.ts";
import type { Location } from "./location.ts";

export type ShapeIssue =
	| { readonly kind: "directlyInLayer" | "tooDeep"; readonly layer: "domain" | "application"; readonly example: string }
	| { readonly kind: "unknownFolder"; readonly layer: "domain" | "application"; readonly folder: string; readonly folders: readonly string[] }
	| { readonly kind: "nestedPublishedLanguage" | "drivenWithoutTechnology" | "drivenTooDeep" | "drivingWithoutTechnology" };

export class LayerShape {
	public constructor(
		private readonly blocks: BuildingBlocks,
		private readonly extraFolders: ExtraFolders,
	) {}

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

	private kindFolderIssue(layer: "domain" | "application", folders: readonly string[]): ShapeIssue | undefined {
		const expected = [...this.blocks.foldersOf(layer), ...(this.extraFolders[layer] ?? [])];
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
