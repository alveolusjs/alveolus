import type { ESLint } from 'eslint';

import { Lay01Boundary } from './boundaries/lay-01-boundary.ts';
import { Lay04Boundary } from './boundaries/lay-04-boundary.ts';
import { Pub01Boundary } from './boundaries/pub-01-boundary.ts';

export const plugin: ESLint.Plugin = {
	meta: { name: '@alveolus/lint-config' },
	rules: {
		'lay-01': new Lay01Boundary().module(),
		'lay-04': new Lay04Boundary().module(),
		'pub-01': new Pub01Boundary().module(),
	},
};
