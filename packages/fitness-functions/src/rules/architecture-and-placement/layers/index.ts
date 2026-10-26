import type { FitnessFunction } from '../../fitness-function.ts';
import { Lay04 } from './lay-04/lay-04.ts';

export const layers: readonly FitnessFunction[] = [new Lay04()];
