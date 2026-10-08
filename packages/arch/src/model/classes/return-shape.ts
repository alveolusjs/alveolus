import type { NamedType } from "./named-type.ts";

export interface ReturnShape {
	readonly alias: NamedType | undefined;
	readonly union: readonly NamedType[];
}
