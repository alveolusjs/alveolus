import { architectureAndPlacement } from './architecture-and-placement/index.ts';
import { domainLogic } from './domain-logic/index.ts';
import type { FitnessFunction } from './fitness-function.ts';
import { integration } from './integration/index.ts';
import { strategicDesign } from './strategic-design/index.ts';

export const registry: readonly FitnessFunction[] = [
	...strategicDesign,
	...domainLogic,
	...architectureAndPlacement,
	...integration,
];
