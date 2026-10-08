import type { CoreKind, CoreMarker } from "../conventions/index.ts";
import { coreDomainSymbols, coreKinds, coreMarkers, corePackageName, corePublishedLanguageSymbols } from "../conventions/index.ts";
import type { ClassType, NamedType, ReturnShape } from "../model/index.ts";

export class CoreApi {
	public get packageName(): string {
		return corePackageName;
	}

	public kindsOf(type: ClassType): CoreKind[] {
		const kinds: CoreKind[] = [];
		for (const ancestor of type.lineage) {
			if (this.isCore(ancestor) && this.isKind(ancestor.name)) {
				kinds.push(ancestor.name);
			}
		}
		return kinds;
	}

	public markersOf(implemented: readonly NamedType[]): CoreMarker[] {
		const markers: CoreMarker[] = [];
		for (const type of implemented) {
			if (this.isCore(type) && this.isMarker(type.name)) {
				markers.push(type.name);
			}
		}
		return markers;
	}

	public isResult(shape: ReturnShape): boolean {
		if (shape.alias !== undefined && shape.alias.name === "Result" && this.isCore(shape.alias)) {
			return true;
		}
		return shape.union.every((member) => (member.name === "Ok" || member.name === "Err") && this.isCore(member));
	}

	public isDomainSymbol(name: string): boolean {
		return coreDomainSymbols.includes(name);
	}

	public isPublishedLanguageSymbol(name: string): boolean {
		return corePublishedLanguageSymbols.includes(name);
	}

	private isKind(name: string): name is CoreKind {
		return (coreKinds as readonly string[]).includes(name);
	}

	private isMarker(name: string): name is CoreMarker {
		return (coreMarkers as readonly string[]).includes(name);
	}

	private isCore(type: NamedType): boolean {
		return type.packageName === corePackageName;
	}
}
