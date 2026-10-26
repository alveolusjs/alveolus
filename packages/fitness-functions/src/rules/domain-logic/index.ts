import type { FitnessFunction } from '../fitness-function.ts';
import { aggregates } from './aggregates/index.ts';
import { domainEvents } from './domain-events/index.ts';
import { entities } from './entities/index.ts';
import { factories } from './factories/index.ts';
import { repositories } from './repositories/index.ts';
import { services } from './services/index.ts';
import { transactionScripts } from './transaction-scripts/index.ts';
import { valueObjects } from './value-objects/index.ts';

export const domainLogic: readonly FitnessFunction[] = [
	...transactionScripts,
	...aggregates,
	...entities,
	...valueObjects,
	...domainEvents,
	...repositories,
	...factories,
	...services,
];
