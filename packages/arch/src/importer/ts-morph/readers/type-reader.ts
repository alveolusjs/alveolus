import type { Symbol as MorphSymbol, Type, ts } from "ts-morph";

import type { NamedType, ReturnShape } from "../../../model/index.ts";
import { ClassType } from "../../../model/index.ts";
import type { PackageNames } from "../package-names.ts";

/** Turns the types of the type checker into the types of the model. */
export class TypeReader {
	public constructor(private readonly packageNames: PackageNames) {}

	/**
	 * The classes a type holds, however deep: unions and intersections, type arguments (of generics and of aliases such as `Pick`),
	 * tuple elements, the properties of object types declared by the project, and what a function returns.
	 * The parameters of a function are not followed: receiving a value is not holding it.
	 */
	public classTypesIn(type: Type): ClassType[] {
		const found: ClassType[] = [];
		this.collectClassTypes(type, found, new Set());
		return found;
	}

	public classTypeOf(type: Type): ClassType {
		const symbol = type.getSymbol();
		const declaredIn = symbol?.getDeclarations()[0]?.getSourceFile().getFilePath();
		return new ClassType(symbol?.getName() ?? type.getText(), declaredIn, this.lineageOf(type));
	}

	public namedTypeOf(type: Type): NamedType {
		const symbol = type.getSymbol() ?? type.getAliasSymbol();
		return symbol === undefined ? { name: type.getText(), packageName: undefined } : this.namedSymbol(symbol);
	}

	/** How a result type is spelled, once a `Promise` is unwrapped. */
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

	/** The class itself, then each class it extends, nearest first. */
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
}
