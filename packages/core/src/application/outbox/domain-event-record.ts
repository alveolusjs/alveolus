import type { DomainEventSnapshot } from '../../domain/domain-events/index.ts';
import type { Correlation } from '../correlation-contexts/index.ts';

export interface DomainEventRecord extends Correlation {
	readonly source: string;
	readonly type: string;
	readonly snapshot: DomainEventSnapshot;
}
