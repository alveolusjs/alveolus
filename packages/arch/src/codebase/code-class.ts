import type { CoreKind, CoreMarker } from "./core-api.ts";
import type { Method } from "./method.ts";
import type { TypeUsage } from "./type-usage.ts";

export interface CodeClassProps {
	readonly name: string;
	readonly line: number;
	readonly isAbstract: boolean;
	readonly isStaticOnly: boolean;
	readonly extendsByName: boolean;
	readonly kinds: readonly CoreKind[];
	readonly markers: readonly CoreMarker[];
	readonly constructorParameters: readonly TypeUsage[];
	readonly fields: readonly TypeUsage[];
	readonly typeArguments: readonly TypeUsage[];
	readonly publicMethods: readonly Method[];
	readonly publicSurface: readonly TypeUsage[];
}

export class CodeClass {
	public readonly name: string;
	public readonly line: number;
	public readonly isAbstract: boolean;
	/** Every member is static: a bag of functions, whatever the class extends. A class without members is not. */
	public readonly isStaticOnly: boolean;
	/** It extends nothing, or a class declaration by its name: no call, cast or constant hides what it extends. */
	public readonly extendsByName: boolean;
	public readonly constructorParameters: readonly TypeUsage[];
	public readonly fields: readonly TypeUsage[];
	/** The class types in the type arguments of the class it extends, named by its type parameters: `Props` of a value object. */
	public readonly typeArguments: readonly TypeUsage[];
	/** The public methods, function properties and setters, static ones aside. */
	public readonly publicMethods: readonly Method[];
	/** The class types a caller sees: in the parameters and results of public methods, public properties and getters. */
	public readonly publicSurface: readonly TypeUsage[];
	private readonly kinds: readonly CoreKind[];
	private readonly markers: readonly CoreMarker[];

	public constructor(props: CodeClassProps) {
		this.name = props.name;
		this.line = props.line;
		this.isAbstract = props.isAbstract;
		this.isStaticOnly = props.isStaticOnly;
		this.extendsByName = props.extendsByName;
		this.kinds = props.kinds;
		this.markers = props.markers;
		this.constructorParameters = props.constructorParameters;
		this.fields = props.fields;
		this.typeArguments = props.typeArguments;
		this.publicMethods = props.publicMethods;
		this.publicSurface = props.publicSurface;
	}

	public is(kind: CoreKind): boolean {
		return this.kinds.includes(kind);
	}

	public implements(marker: CoreMarker): boolean {
		return this.markers.includes(marker);
	}

	/** The fields and the constructor parameters, each once: a parameter property is both. */
	public get members(): TypeUsage[] {
		const byName = new Map<string, TypeUsage>();
		for (const member of [...this.fields, ...this.constructorParameters]) {
			byName.set(`${member.member}:${member.typeName}`, member);
		}
		return [...byName.values()];
	}

	public get extendsBuildingBlock(): boolean {
		return this.kinds.length > 0;
	}
}
