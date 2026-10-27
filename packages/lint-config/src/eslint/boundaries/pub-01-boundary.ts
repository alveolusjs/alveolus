import { pub01 } from '../../rules.ts';
import { ImportBoundary } from '../import-boundary.ts';

const contract = /^src\/([^/]+)\/public\//;
const layers = ['domain', 'application', 'driving', 'driven'];

export class Pub01Boundary extends ImportBoundary {
	public constructor() {
		super(pub01);
	}

	protected crosses(from: string, to: string): boolean {
		const own = contract.exec(from)?.[1];

		return own !== undefined && layers.some((layer) => to.startsWith(`src/${own}/${layer}/`));
	}
}
