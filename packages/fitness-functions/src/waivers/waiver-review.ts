import type { Violation } from '../violations/violation.ts';
import type { WaivedViolation } from '../violations/waived-violation.ts';

export class WaiverReview {
	public constructor(
		public readonly remaining: readonly Violation[],
		public readonly waived: readonly WaivedViolation[],
	) {}
}
