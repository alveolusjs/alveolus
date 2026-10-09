import { ts } from "ts-morph";
import type { Symbol as MorphSymbol, Type } from "ts-morph";

import { normalize } from "node:path";

import type { NamedType, ReturnShape } from "../../../model/index.ts";
import { ClassType } from "../../../model/index.ts";
import type { PackageNames } from "../package-names.ts";

const collections: readonly string[] = ["Map", "Set", "WeakMap", "WeakSet"];

const readonlyCollections: readonly string[] = ["ReadonlyMap", "ReadonlySet", "ReadonlyArray"];

export class TypeReader {
	public constructor(private readonly packageNames: PackageNames) {}

	public classTypesIn(type: Type): ClassType[] {
		const found: ClassType[] = [];
		this.collectClassTypes(type, found, new Set());
		return found;
	}

	public classTypeOf(type: Type): ClassType {
		const symbol = type.getSymbol();
		const declaredIn = symbol?.getDeclarations()[0]?.getSourceFile().getFilePath();
		return new ClassType(symbol?.getName() ?? type.getText(), declaredIn === undefined ? undefined : normalize(declaredIn), this.lineageOf(type));
	}

	public namedTypeOf(type: Type): NamedType {
		const symbol = type.getSymbol() ?? type.getAliasSymbol();
		return symbol === undefined ? { name: type.getText(), packageName: undefined } : this.namedSymbol(symbol);
	}

	public holdsCollection(type: Type): boolean {
		if (type.isArray() || type.isTuple()) {
			return !type.isReadonlyArray();
		}
		if (collections.includes(type.getSymbol()?.getName() ?? "")) {
			return true;
		}
		if (type.getStringIndexType() !== undefined || type.getNumberIndexType() !== undefined) {
			return true;
		}
		return type.isAnonymous() && type.getCallSignatures().length === 0 && type.getConstructSignatures().length === 0;
	}

	public opaqueValueIn(type: Type): string | undefined {
		return this.findsOpaqueValue(type, new Set());
	}

	public holdsFunction(type: Type): boolean {
		return this.findsFunction(type, new Set());
	}

	public erasedNameOf(type: Type): string | undefined {
		const settled = this.settled(type);
		if (settled.isAny()) {
			return "any";
		}
		if (settled.isUnknown()) {
			return "unknown";
		}
		return (settled.getFlags() & ts.TypeFlags.NonPrimitive) === 0 ? undefined : "object";
	}

	public returnShapeOf(type: Type): ReturnShape {
		if (type.getSymbol()?.getName() === "Promise") {
			const [inner] = type.getTypeArguments();
			if (inner !== undefined) {
				return this.returnShapeOf(inner);
			}
		}
		const alias = type.getAliasSymbol();
		const members = type.isUnion() ? type.getUnionTypes() : [type];
		return {
			alias: alias === undefined ? undefined : this.namedSymbol(alias),
			union: members.map((member) => this.namedTypeOf(member)),
		};
	}

	private findsOpaqueValue(type: Type, seen: Set<ts.Type>): string | undefined {
		if (seen.has(type.compilerType)) {
			return undefined;
		}
		seen.add(type.compilerType);
		if (type.isAny() || type.isUnknown()) {
			return type.getText();
		}
		if (type.isUnion()) {
			return this.firstOpaque(type.getUnionTypes(), seen);
		}
		if (type.isIntersection()) {
			return this.firstOpaque(type.getIntersectionTypes(), seen);
		}
		if (!type.isObject() || type.isClass()) {
			return undefined;
		}
		if (type.getCallSignatures().length > 0 || type.getConstructSignatures().length > 0) {
			return "a function";
		}
		if (type.isArray() || type.isTuple()) {
			if (!type.isReadonlyArray()) {
				return "a mutable array";
			}
			return this.firstOpaque(type.isTuple() ? type.getTupleElements() : type.getTypeArguments(), seen);
		}
		if (readonlyCollections.includes(type.getSymbol()?.getName() ?? "")) {
			return this.firstOpaque(type.getTypeArguments(), seen);
		}
		return "an object";
	}

	private firstOpaque(types: readonly Type[], seen: Set<ts.Type>): string | undefined {
		for (const inner of types) {
			const opaque = this.findsOpaqueValue(inner, seen);
			if (opaque !== undefined) {
				return opaque;
			}
		}
		return undefined;
	}

	private findsFunction(type: Type, seen: Set<ts.Type>): boolean {
		if (seen.has(type.compilerType)) {
			return false;
		}
		seen.add(type.compilerType);
		if (type.isUnion()) {
			return type.getUnionTypes().some((member) => this.findsFunction(member, seen));
		}
		if (type.isIntersection()) {
			return type.getIntersectionTypes().some((member) => this.findsFunction(member, seen));
		}
		if (type.isClass()) {
			return false;
		}
		if (type.getCallSignatures().length > 0 || type.getConstructSignatures().length > 0) {
			return true;
		}
		return this.dataTypesOf(type).some((inner) => this.findsFunction(inner, seen));
	}

	private dataTypesOf(type: Type): Type[] {
		const inner = [...type.getTypeArguments(), ...type.getAliasTypeArguments(), ...type.getTupleElements()];
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

	private settled(type: Type): Type {
		const [inner] = type.getTypeArguments();
		return type.getSymbol()?.getName() === "Promise" && inner !== undefined ? this.settled(inner) : type;
	}

	private lineageOf(type: Type): NamedType[] {
		const classType = type.getTargetType() ?? type;
		const symbol = classType.getSymbol();
		if (symbol === undefined || !classType.isClass()) {
			return [];
		}
		const lineage = [this.namedSymbol(symbol)];
		for (const base of classType.getBaseTypes()) {
			lineage.push(...this.lineageOf(base));
		}
		return lineage;
	}

	private namedSymbol(symbol: MorphSymbol): NamedType {
		const declaration = symbol.getDeclarations()[0];
		const packageName = declaration === undefined ? undefined : this.packageNames.ofFile(declaration.getSourceFile().getFilePath());
		return { name: symbol.getName(), packageName };
	}

	private collectClassTypes(type: Type, found: ClassType[], seen: Set<ts.Type>): void {
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
			found.push(this.classTypeOf(type));
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
}
