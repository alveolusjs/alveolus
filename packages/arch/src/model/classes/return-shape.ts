import type { NamedType } from "./named-type.ts";

/** How a result type is spelled, once a `Promise` is unwrapped: the alias it is written with, and the named types of its union. */
export interface ReturnShape {
	readonly alias: NamedType | undefined;
	readonly union: readonly NamedType[];
}
