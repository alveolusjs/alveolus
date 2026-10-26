import type { Violation } from '../violations/violation.ts';

export class Waiver {
	public constructor(
		public readonly code: string,
		public readonly reason: string | undefined,
		public readonly file: string,
		public readonly line: number,
	) {}

	public covers(violation: Violation): boolean {
		return violation.file === this.file && (violation.line === this.line || violation.line === this.line + 1);
	}
}
