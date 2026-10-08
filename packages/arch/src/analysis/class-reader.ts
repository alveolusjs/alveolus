import { Node, Scope } from "ts-morph";
import type { ClassDeclaration, GetAccessorDeclaration, MethodDeclaration, ParameterDeclaration, PropertyDeclaration, SetAccessorDeclaration, Type } from "ts-morph";

import type { CoreMarker } from "../codebase/index.ts";
import { CodeClass, Method, TypeUsage } from "../codebase/index.ts";
import type { TypeInspector } from "./type-inspector.ts";

export class ClassReader {
	public constructor(private readonly types: TypeInspector) {}

	public read(declaration: ClassDeclaration): CodeClass {
		const parameters = declaration.getConstructors()[0]?.getParameters() ?? [];
		const parameterProperties = parameters.filter((parameter) => parameter.isParameterProperty());

		return new CodeClass({
			constructorParameters: parameters.flatMap((parameter) => this.usagesOf(parameter)),
			extendsByName: this.extendsByName(declaration),
			fields: [...declaration.getProperties(), ...parameterProperties].flatMap((member) => this.usagesOf(member)),
			isAbstract: declaration.isAbstract(),
			isStaticOnly: this.isStaticOnly(declaration, parameterProperties.length),
			kinds: this.types.kindsOf(declaration.getType()),
			line: declaration.getStartLineNumber(),
			markers: this.markersOf(declaration),
			name: declaration.getName() ?? "default",
			publicMethods: this.publicMethodsOf(declaration),
			publicSurface: this.publicSurfaceOf(declaration, parameterProperties),
			typeArguments: this.typeArgumentsOf(declaration),
		});
	}

	private extendsByName(declaration: ClassDeclaration): boolean {
		const heritage = declaration.getExtends();
		if (heritage === undefined) {
			return true;
		}
		const expression = heritage.getExpression();
		if (!Node.isIdentifier(expression) && !Node.isPropertyAccessExpression(expression)) {
			return false;
		}
		const symbol = expression.getSymbol();
		const target = symbol?.getAliasedSymbol() ?? symbol;
		return target?.getDeclarations().some((candidate) => Node.isClassDeclaration(candidate)) ?? false;
	}

	private isStaticOnly(declaration: ClassDeclaration, parameterProperties: number): boolean {
		const members = declaration.getMembers().filter((member) => !Node.isConstructorDeclaration(member));
		const statics = members.filter((member) => Node.isStaticable(member) && member.isStatic());
		const hasInstance = parameterProperties > 0 || statics.length < members.length;
		return statics.length > 0 && !hasInstance;
	}

	private markersOf(declaration: ClassDeclaration): CoreMarker[] {
		const markers: CoreMarker[] = [];
		for (const clause of declaration.getImplements()) {
			const marker = this.types.markerOf(clause.getType());
			if (marker !== undefined) {
				markers.push(marker);
			}
		}
		return markers;
	}

	private publicMethodsOf(declaration: ClassDeclaration): Method[] {
		const methods = declaration
			.getMethods()
			.filter((method) => this.isPublicInstanceMember(method))
			.map((method) => new Method(method.getName(), method.getStartLineNumber(), this.types.isResult(method.getReturnType()), "method"));
		const functionProperties = declaration
			.getProperties()
			.filter((property) => this.isPublicInstanceMember(property) && property.getType().getCallSignatures().length > 0)
			.map((property) => new Method(property.getName(), property.getStartLineNumber(), this.returnsResult(property.getType()), "function property"));
		const setters = declaration
			.getSetAccessors()
			.filter((setter) => this.isPublicInstanceMember(setter))
			.map((setter) => new Method(setter.getName(), setter.getStartLineNumber(), false, "setter"));
		return [...methods, ...functionProperties, ...setters].sort((left, right) => left.line - right.line);
	}

	/** The types a caller sees: parameters and results of public methods, public properties and getters. */
	private publicSurfaceOf(declaration: ClassDeclaration, parameterProperties: readonly ParameterDeclaration[]): TypeUsage[] {
		const usages: TypeUsage[] = [];
		for (const method of declaration.getMethods().filter((candidate) => this.isPublicInstanceMember(candidate))) {
			for (const parameter of method.getParameters()) {
				usages.push(...this.usagesIn(parameter.getType(), method.getName(), method.getStartLineNumber()));
			}
			usages.push(...this.usagesIn(method.getReturnType(), method.getName(), method.getStartLineNumber()));
		}
		for (const property of declaration.getProperties().filter((candidate) => this.isPublicInstanceMember(candidate))) {
			usages.push(...this.usagesOf(property));
		}
		for (const getter of declaration.getGetAccessors().filter((candidate) => this.isPublicInstanceMember(candidate))) {
			usages.push(...this.usagesIn(getter.getReturnType(), getter.getName(), getter.getStartLineNumber()));
		}
		for (const parameter of parameterProperties.filter((candidate) => candidate.getScope() === Scope.Public)) {
			usages.push(...this.usagesOf(parameter));
		}
		return usages;
	}

	private isPublicInstanceMember(member: MethodDeclaration | PropertyDeclaration | GetAccessorDeclaration | SetAccessorDeclaration): boolean {
		return !member.isStatic() && member.getScope() === Scope.Public && !member.getName().startsWith("#");
	}

	private returnsResult(type: Type): boolean {
		return type.getCallSignatures().every((signature) => this.types.isResult(signature.getReturnType()));
	}

	private usagesOf(member: PropertyDeclaration | ParameterDeclaration): TypeUsage[] {
		return this.usagesIn(member.getType(), member.getName(), member.getStartLineNumber());
	}

	private typeArgumentsOf(declaration: ClassDeclaration): TypeUsage[] {
		const heritage = declaration.getExtends();
		if (heritage === undefined) {
			return [];
		}
		const parameters = declaration.getBaseClass()?.getTypeParameters() ?? [];
		return heritage.getTypeArguments().flatMap((argument, index) => {
			const name = parameters[index]?.getName() ?? argument.getText();
			return this.usagesIn(argument.getType(), name, argument.getStartLineNumber());
		});
	}

	private usagesIn(type: Type, member: string, line: number): TypeUsage[] {
		return this.types.classTypesIn(type).map((classType) => {
			const symbol = classType.getSymbol();
			const declaredIn = symbol?.getDeclarations()[0]?.getSourceFile().getFilePath();
			return new TypeUsage(member, line, symbol?.getName() ?? classType.getText(), this.types.kindsOf(classType), declaredIn);
		});
	}
}
