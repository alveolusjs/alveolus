export type GlobalAccess = "reads" | "writes";

export class GlobalChannel {
	public constructor(
		public readonly line: number,
		public readonly name: string,
		public readonly access: GlobalAccess,
	) {}
}
