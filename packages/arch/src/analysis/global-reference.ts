import type { GlobalEffect } from "../codebase/index.ts";

/** A global used by a file, with the file that declares it: `project` globals are declared by the project itself. */
export interface GlobalReference {
	readonly line: number;
	readonly name: string;
	readonly declaredIn: string;
	readonly origin: "ecmascript" | "host" | "project";
	readonly effect: GlobalEffect | undefined;
}
