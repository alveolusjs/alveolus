import type { FitnessFunction } from '../fitness-function.ts';
import { contracts } from './contracts/index.ts';
import { messaging } from './messaging/index.ts';
import { remoteCalls } from './remote-calls/index.ts';
import { translation } from './translation/index.ts';

export const integration: readonly FitnessFunction[] = [...contracts, ...translation, ...messaging, ...remoteCalls];
