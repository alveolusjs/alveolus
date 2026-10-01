import type { Symbol as MorphSymbol, Type } from "ts-morph";

import type { CoreKind, CoreMarker } from "../codebase/index.ts";
import { CoreApi } from "../codebase/index.ts";
import type { PackageNames } from "./package-names.ts";

const containers: ReadonlySet<string> = new Set(["Array", "ReadonlyArray", "Map", "ReadonlyMap", "Set", "ReadonlySet", "Readonly", "Promise"]);

export class TypeInspector {
	public constructor(private readonly packageNames: PackageNames) {}

	public kindsOf(type: Type): CoreKind[] {
		const classType = type.getTargetType() ?? type;
		const symbol = classType.getSymbol();
		if (symbol === undefined || !classType.isClass()) {
			return [];
		}

		const kinds: CoreKind[] = [];
		const name = symbol.getName();
		if (CoreApi.isKind(name) && this.isCore(symbol)) {
			kinds.push(name);
		}
		for (const base of classType.getBaseTypes()) {
			kinds.push(...this.kindsOf(base));
		}
		return kinds;
	}

	public markerOf(type: Type): CoreMarker | undefined {
		const symbol = type.getSymbol();
		if (symbol === undefined) {
			return undefined;
		}
		const name = symbol.getName();
		return CoreApi.isMarker(name) && this.isCore(symbol) ? name : undefined;
	}

	public isResult(type: Type): boolean {
		const alias = type.getAliasSymbol();
		if (alias !== undefined && alias.getName() === "Result" && this.isCore(alias)) {
			return true;
		}
		const members = type.isUnion() ? type.getUnionTypes() : [type];
		return members.every((member) => this.isOkOrErr(member));
	}

	public classTypesIn(type: Type): Type[] {
		if (type.isUnion()) {
			return type.getUnionTypes().flatMap((member) => this.classTypesIn(member));
		}
		if (type.isIntersection()) {
			return type.getIntersectionTypes().flatMap((member) => this.classTypesIn(member));
		}
		const element = type.getArrayElementType();
		if (element !== undefined) {
			return this.classTypesIn(element);
		}
		if (this.isContainer(type)) {
			return [...type.getTypeArguments(), ...type.getAliasTypeArguments()].flatMap((argument) => this.classTypesIn(argument));
		}
		return type.isClass() ? [type] : [];
	}

	private isContainer(type: Type): boolean {
		const name = type.getSymbol()?.getName() ?? type.getAliasSymbol()?.getName();
		return name !== undefined && containers.has(name);
	}

	private isOkOrErr(type: Type): boolean {
		const symbol = type.getSymbol();
		if (symbol === undefined) {
			return false;
		}
		const name = symbol.getName();
		return (name === "Ok" || name === "Err") && this.isCore(symbol);
	}

	private isCore(symbol: MorphSymbol): boolean {
		const declaration = symbol.getDeclarations()[0];
		if (declaration === undefined) {
			return false;
		}
		return this.packageNames.ofFile(declaration.getSourceFile().getFilePath()) === CoreApi.packageName;
	}
}
