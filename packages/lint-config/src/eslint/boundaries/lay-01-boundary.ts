import { lay01 } from '../../rules.ts';
import { ImportBoundary } from '../import-boundary.ts';

const inside = /^src\/([^/]+)\/internal\/(?:domain|application)\//;
const adapters = /^src\/([^/]+)\/internal\/(?:driving|driven)\//;

export class Lay01Boundary extends ImportBoundary {
	public constructor() {
		super(lay01);
	}

	protected crosses(from: string, to: string): boolean {
		const own = inside.exec(from)?.[1];

		return own !== undefined && adapters.exec(to)?.[1] === own;
	}
}
