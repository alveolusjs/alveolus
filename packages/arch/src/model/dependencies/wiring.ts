import type { ClassType } from "../classes/class-type.ts";

export interface WiringLink {
	readonly text: string;
	readonly declaredIn: string | undefined;
	readonly types: readonly ClassType[];
}

export class Wiring {
	public constructor(
		public readonly line: number,
		public readonly receiver: string,
		public readonly links: readonly WiringLink[],
	) {}
}
