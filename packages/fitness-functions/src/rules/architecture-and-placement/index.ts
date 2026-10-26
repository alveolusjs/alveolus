import type { FitnessFunction } from '../fitness-function.ts';
import { httpApi } from './http-api/index.ts';
import { layers } from './layers/index.ts';
import { naming } from './naming/index.ts';
import { persistence } from './persistence/index.ts';
import { placement } from './placement/index.ts';
import { tests } from './tests/index.ts';
import { useCases } from './use-cases/index.ts';
import { wiring } from './wiring/index.ts';

export const architectureAndPlacement: readonly FitnessFunction[] = [
	...layers,
	...placement,
	...naming,
	...wiring,
	...useCases,
	...httpApi,
	...persistence,
	...tests,
];
