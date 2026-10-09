import type { ClassType } from "../classes/class-type.ts";

export class ModuleReach {
	public constructor(
		public readonly line: number,
		public readonly expression: string,
		public readonly means: string,
		public readonly module: ClassType,
	) {}
}
