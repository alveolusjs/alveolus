import type { Symbol as MorphSymbol, Type, ts } from "ts-morph";

import type { CoreKind, CoreMarker } from "../codebase/index.ts";
import { CoreApi } from "../codebase/index.ts";
import type { PackageNames } from "./package-names.ts";

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

	/** Whether a type is a `Result`, or a `Promise` of one. */
	public isResult(type: Type): boolean {
		if (type.getSymbol()?.getName() === "Promise") {
			const [inner] = type.getTypeArguments();
			return inner !== undefined && this.isResult(inner);
		}
		const alias = type.getAliasSymbol();
		if (alias !== undefined && alias.getName() === "Result" && this.isCore(alias)) {
			return true;
		}
		const members = type.isUnion() ? type.getUnionTypes() : [type];
		return members.every((member) => this.isOkOrErr(member));
	}

	/**
	 * The class types a type holds, however deep: unions and intersections, type arguments (of generics and of aliases such as
	 * `Pick`), tuple elements, the properties of object types declared by the project, and what a function returns.
	 * The parameters of a function are not followed: receiving a value is not holding it.
	 */
	public classTypesIn(type: Type): Type[] {
		const found: Type[] = [];
		this.collectClassTypes(type, found, new Set());
		return found;
	}

	private collectClassTypes(type: Type, found: Type[], seen: Set<ts.Type>): void {
		if (seen.has(type.compilerType)) {
			return;
		}
		seen.add(type.compilerType);

		if (type.isUnion()) {
			for (const member of type.getUnionTypes()) {
				this.collectClassTypes(member, found, seen);
			}
			return;
		}
		if (type.isIntersection()) {
			for (const member of type.getIntersectionTypes()) {
				this.collectClassTypes(member, found, seen);
			}
			return;
		}
		if (type.isClass()) {
			found.push(type);
		}
		for (const inner of this.innerTypesOf(type)) {
			this.collectClassTypes(inner, found, seen);
		}
	}

	private innerTypesOf(type: Type): Type[] {
		const inner = [...type.getTypeArguments(), ...type.getAliasTypeArguments(), ...type.getTupleElements()];
		for (const signature of type.getCallSignatures()) {
			inner.push(signature.getReturnType());
		}
		if (this.isDeclaredByProject(type)) {
			for (const property of type.getProperties()) {
				const declaration = property.getDeclarations()[0];
				if (declaration !== undefined) {
					inner.push(declaration.getType());
				}
			}
		}
		return inner;
	}

	/** An object type of the project, such as an interface or `{ customer: Customer }`; libraries are not walked into. */
	private isDeclaredByProject(type: Type): boolean {
		if (!type.isObject() || type.isClass()) {
			return false;
		}
		const declaration = (type.getSymbol() ?? type.getAliasSymbol())?.getDeclarations()[0];
		if (declaration === undefined) {
			return false;
		}
		const file = declaration.getSourceFile();
		return !file.isInNodeModules() && !file.isDeclarationFile();
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
