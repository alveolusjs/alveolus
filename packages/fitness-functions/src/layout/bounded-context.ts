import type { ContextStyle, ImplementationStyle } from './style.ts';

export class BoundedContext {
	public constructor(
		public readonly name: string,
		public readonly style: ContextStyle,
		public readonly path: string,
	) {}

	public contains(file: string): boolean {
		return file.startsWith(`${this.path}/`);
	}

	public folderOf(file: string): string | undefined {
		const segments = file.slice(this.path.length + 1).split('/');

		if (segments.length < 2) {
			return undefined;
		}

		return segments[0];
	}

	public follows(styles: readonly ImplementationStyle[]): boolean {
		return styles.some((style) => style === this.style);
	}

	public isBigBallOfMud(): boolean {
		return this.style === 'big-ball-of-mud';
	}

	public publicFolder(): string {
		return `${this.path}/public`;
	}
}
