const sourceFolder = 'src';
const sharedFolder = 'shared';
const publicFolder = 'public';

export class Placement {
	private constructor(
		public readonly context: string,
		public readonly folder: string | undefined,
	) {}

	public static of(path: string): Placement | undefined {
		const segments = path.split('/');
		const [source, context] = segments;

		if (source !== sourceFolder || context === undefined || context === sharedFolder || segments.length < 3) {
			return undefined;
		}

		if (segments.length === 3) {
			return new Placement(context, undefined);
		}

		return new Placement(context, segments[2]);
	}

	public isInAnotherContextThan(other: Placement): boolean {
		return this.context !== other.context;
	}

	public isPublic(): boolean {
		return this.folder === publicFolder;
	}

	public publicFolder(): string {
		return `${sourceFolder}/${this.context}/${publicFolder}`;
	}
}
