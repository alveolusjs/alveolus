export type GlobalOrigin = "ecmascript" | "host";

export type GlobalEffect = "clock" | "randomness";

export class GlobalUse {
	public constructor(
		public readonly line: number,
		public readonly name: string,
		public readonly origin: GlobalOrigin,
		public readonly effect: GlobalEffect | undefined,
	) {}
}
