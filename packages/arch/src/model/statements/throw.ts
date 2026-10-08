/** How a failure is raised instead of returned. */
export type ThrowForm = "throw" | "Promise.reject";

export class Throw {
	public constructor(
		public readonly line: number,
		public readonly form: ThrowForm,
	) {}
}
