/** Where a global comes from: the ECMAScript library, or the host running the code (DOM, Node, a test runner). */
export type GlobalOrigin = "ecmascript" | "host";

/** What an ECMAScript built-in reads from outside the code. */
export type GlobalEffect = "clock" | "randomness";

export class GlobalUse {
	public constructor(
		public readonly line: number,
		public readonly name: string,
		public readonly origin: GlobalOrigin,
		public readonly effect: GlobalEffect | undefined,
	) {}
}
