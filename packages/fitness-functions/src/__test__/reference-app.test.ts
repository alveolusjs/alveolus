import { describe, expect, it } from 'vitest';

import { registry } from '../rules/registry.ts';
import { TestProject } from './support/test-project.ts';

const fitness = TestProject.app().fitness();
const codes = registry.map((fitnessFunction) => fitnessFunction.rule.code);

describe('reference app', () => {
	it.each(codes)('%s accepts it', (code) => {
		expect(fitness.check(code)).toEqual([]);
	});
});
