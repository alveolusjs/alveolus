import { lay01 } from '../../rules.ts';
import { ImportBoundary } from '../import-boundary.ts';

const inside = /^src\/([^/]+)\/(?:domain|application)\//;

export class Lay01Boundary extends ImportBoundary {
	public constructor() {
		super(lay01);
	}

	protected crosses(from: string, to: string): boolean {
		const own = inside.exec(from)?.[1];

		return own !== undefined && (to.startsWith(`src/${own}/driving/`) || to.startsWith(`src/${own}/driven/`));
	}
}
