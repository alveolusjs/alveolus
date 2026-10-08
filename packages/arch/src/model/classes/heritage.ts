import type { ClassType } from "./class-type.ts";

/** A type argument given to the extended class, named after the type parameter it fills: `Props` of `ValueObject<Props>`. */
export interface TypeArgument {
	readonly parameter: string;
	readonly line: number;
	readonly types: readonly ClassType[];
}

/** The `extends` clause of a class. */
export interface Heritage {
	/** The clause names a class declaration: no call, cast or constant hides what is extended. */
	readonly isByName: boolean;
	readonly typeArguments: readonly TypeArgument[];
}
