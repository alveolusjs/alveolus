import type { ClassType } from "./class-type.ts";

export interface TypeArgument {
	readonly parameter: string;
	readonly line: number;
	readonly types: readonly ClassType[];
}

export interface Heritage {
	readonly isByName: boolean;
	readonly typeArguments: readonly TypeArgument[];
}
