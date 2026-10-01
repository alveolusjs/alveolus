import type { CoreKind, CoreMarker } from "./core-api.ts";
import type { Method } from "./method.ts";
import type { TypeUsage } from "./type-usage.ts";

export interface CodeClassProps {
	readonly name: string;
	readonly line: number;
	readonly isAbstract: boolean;
	readonly kinds: readonly CoreKind[];
	readonly markers: readonly CoreMarker[];
	readonly constructorParameters: readonly TypeUsage[];
	readonly fields: readonly TypeUsage[];
	readonly publicMethods: readonly Method[];
}

export class CodeClass {
	public readonly name: string;
	public readonly line: number;
	public readonly isAbstract: boolean;
	public readonly constructorParameters: readonly TypeUsage[];
	public readonly fields: readonly TypeUsage[];
	public readonly publicMethods: readonly Method[];
	private readonly kinds: readonly CoreKind[];
	private readonly markers: readonly CoreMarker[];

	public constructor(props: CodeClassProps) {
		this.name = props.name;
		this.line = props.line;
		this.isAbstract = props.isAbstract;
		this.kinds = props.kinds;
		this.markers = props.markers;
		this.constructorParameters = props.constructorParameters;
		this.fields = props.fields;
		this.publicMethods = props.publicMethods;
	}

	public is(kind: CoreKind): boolean {
		return this.kinds.includes(kind);
	}

	public implements(marker: CoreMarker): boolean {
		return this.markers.includes(marker);
	}

	public get extendsBuildingBlock(): boolean {
		return this.kinds.length > 0;
	}

	public get hasMarker(): boolean {
		return this.markers.length > 0;
	}
}
