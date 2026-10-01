import { Scope } from "ts-morph";
import type { ClassDeclaration, ParameterDeclaration, PropertyDeclaration } from "ts-morph";

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
			fields: [...declaration.getProperties(), ...parameterProperties].flatMap((member) => this.usagesOf(member)),
			isAbstract: declaration.isAbstract(),
			kinds: this.types.kindsOf(declaration.getType()),
			line: declaration.getStartLineNumber(),
			markers: this.markersOf(declaration),
			name: declaration.getName() ?? "default",
			publicMethods: this.publicMethodsOf(declaration),
		});
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
		return declaration
			.getMethods()
			.filter((method) => !method.isStatic() && method.getScope() === Scope.Public)
			.map((method) => new Method(method.getName(), method.getStartLineNumber(), this.types.isResult(method.getReturnType())));
	}

	private usagesOf(member: PropertyDeclaration | ParameterDeclaration): TypeUsage[] {
		return this.types
			.classTypesIn(member.getType())
			.map((type) => new TypeUsage(member.getName(), member.getStartLineNumber(), type.getSymbol()?.getName() ?? type.getText(), this.types.kindsOf(type)));
	}
}
