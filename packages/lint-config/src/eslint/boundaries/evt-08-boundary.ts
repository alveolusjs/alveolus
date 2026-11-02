import { evt08 } from '../../rules.ts';
import { ImportBoundary } from '../import-boundary.ts';

const eventHandler = /^src\/([^/]+)\/internal\/driving\/.+\.event-handler\.ts$/;

export class Evt08Boundary extends ImportBoundary {
	public constructor() {
		super(evt08);
	}

	protected crosses(from: string, to: string): boolean {
		const own = eventHandler.exec(from)?.[1];

		return own !== undefined && to.startsWith(`src/${own}/public/`);
	}
}
