import type { FitnessFunction } from '../fitness-function.ts';
import { boundedContexts } from './bounded-contexts/index.ts';
import { contextMaps } from './context-maps/index.ts';

export const strategicDesign: readonly FitnessFunction[] = [...boundedContexts, ...contextMaps];
