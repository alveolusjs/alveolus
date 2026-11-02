import { type IdGenerator, Port } from '../../domain/ports/index.ts';
import type { Correlation } from './correlation.ts';

export abstract class CorrelationContext extends Port {
	readonly #ids: IdGenerator;

	public constructor(ids: IdGenerator) {
		super();
		this.#ids = ids;
	}

	public current(): Correlation {
		return this.active() ?? { correlationId: this.#ids.next() };
	}

	public abstract run<T>(correlation: Correlation, work: () => Promise<T>): Promise<T>;

	protected abstract active(): Correlation | undefined;
}
