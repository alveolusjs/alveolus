import { lay04 } from '../../rules.ts';
import { ImportBoundary } from '../import-boundary.ts';

const context = /^src\/([^/]+)\//;

export class Lay04Boundary extends ImportBoundary {
	public constructor() {
		super(lay04);
	}

	protected crosses(from: string, to: string): boolean {
		const own = context.exec(from)?.[1];
		const reached = context.exec(to)?.[1];

		if (own === undefined || reached === undefined || own === 'shared' || reached === 'shared' || own === reached) {
			return false;
		}

		return !to.startsWith(`src/${reached}/public/`);
	}
}
