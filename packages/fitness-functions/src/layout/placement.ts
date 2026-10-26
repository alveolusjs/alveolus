import type { BoundedContext } from './bounded-context.ts';

const publicFolder = 'public';

export class Placement {
	public constructor(
		public readonly context: BoundedContext,
		public readonly folder: string | undefined,
	) {}

	public isInAnotherContextThan(other: Placement): boolean {
		return this.context.name !== other.context.name;
	}

	public isPublic(): boolean {
		return this.folder === publicFolder;
	}
}
