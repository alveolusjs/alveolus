import type { Dependency } from './dependency.ts';

export class SourceFile {
	public constructor(
		public readonly path: string,
		public readonly dependencies: readonly Dependency[],
	) {}
}
