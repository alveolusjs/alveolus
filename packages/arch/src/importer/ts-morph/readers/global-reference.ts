import type { GlobalEffect } from "../../../model/index.ts";

export interface GlobalReference {
	readonly line: number;
	readonly name: string;
	readonly declaredIn: string;
	readonly origin: "ecmascript" | "host" | "project";
	readonly effect: GlobalEffect | undefined;
}
