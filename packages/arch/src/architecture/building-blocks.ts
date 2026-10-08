import type { CoreMarker } from "../conventions/index.ts";
import { buildingBlockPlaces, extraDomainFolders, markerPlaces } from "../conventions/index.ts";
import type { ClassDeclaration } from "../model/index.ts";
import type { CoreApi } from "./core-api.ts";
import { Place } from "./paths/place.ts";

export interface MarkedPlace {
	readonly marker: CoreMarker;
	readonly place: Place;
}

export class BuildingBlocks {
	public constructor(private readonly core: CoreApi) {}

	public placeOf(declaration: ClassDeclaration): Place | undefined {
		const kinds = this.core.kindsOf(declaration.type);
		for (const entry of buildingBlockPlaces) {
			if (kinds.includes(entry.kind) && !(entry.concreteOnly === true && declaration.isAbstract)) {
				return new Place(entry);
			}
		}
		return undefined;
	}

	public markedPlacesOf(declaration: ClassDeclaration): MarkedPlace[] {
		const markers = this.core.markersOf(declaration.implemented);
		const places: MarkedPlace[] = [];
		for (const entry of markerPlaces) {
			if (markers.includes(entry.marker)) {
				places.push({ marker: entry.marker, place: new Place(entry) });
			}
		}
		return places;
	}

	public foldersOf(layer: "domain" | "application"): readonly string[] {
		const folders: string[] = [];
		for (const entry of buildingBlockPlaces) {
			if (entry.layer === layer && entry.folder !== undefined && !folders.includes(entry.folder)) {
				folders.push(entry.folder);
			}
		}
		if (layer === "domain") {
			folders.push(...extraDomainFolders);
		}
		return folders;
	}
}
