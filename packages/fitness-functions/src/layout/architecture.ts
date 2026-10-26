import type { BoundedContext } from './bounded-context.ts';
import { Placement } from './placement.ts';
import type { ImplementationStyle } from './style.ts';

export const sourceFolder = 'src';
export const sharedFolder = 'shared';

export class Architecture {
	public constructor(public readonly contexts: readonly BoundedContext[]) {}

	public sourceFolders(): string[] {
		const folders = [sourceFolder];

		for (const context of this.contexts) {
			if (!context.path.startsWith(`${sourceFolder}/`)) {
				folders.push(context.path);
			}
		}

		return folders;
	}

	public placementOf(file: string): Placement | undefined {
		let owner: BoundedContext | undefined;

		for (const context of this.contexts) {
			if (context.contains(file) && context.path.length > (owner?.path.length ?? -1)) {
				owner = context;
			}
		}

		if (owner === undefined) {
			return undefined;
		}

		return new Placement(owner, owner.folderOf(file));
	}

	public checks(file: string, styles: readonly ImplementationStyle[]): boolean {
		const placement = this.placementOf(file);

		if (placement === undefined) {
			return true;
		}

		return placement.context.follows(styles);
	}
}
