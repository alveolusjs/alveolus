import type { ESLint } from 'eslint';

import { nam09, uc11 } from '../rules.ts';
import { Lay01Boundary } from './boundaries/lay-01-boundary.ts';
import { Lay04Boundary } from './boundaries/lay-04-boundary.ts';
import { Pub01Boundary } from './boundaries/pub-01-boundary.ts';
import { MustUseResult } from './must-use-result.ts';
import { ReexposedRule } from './reexposed-rule.ts';

export const plugin: ESLint.Plugin = {
	meta: { name: '@alveolus/lint-config' },
	rules: {
		'lay-01': new Lay01Boundary().module(),
		'lay-04': new Lay04Boundary().module(),
		'pub-01': new Pub01Boundary().module(),
		'nam-09-parameter-properties': new ReexposedRule(nam09, 'parameter-properties').module(),
		'uc-11-must-use-result': new MustUseResult(uc11).module(),
		'uc-11-no-floating-promises': new ReexposedRule(uc11, 'no-floating-promises').module(),
		'uc-11-no-unused-vars': new ReexposedRule(uc11, 'no-unused-vars').module(),
	},
};
