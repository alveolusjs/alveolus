import { describe, expect, it } from 'vitest';

import { TestApp } from './support/test-app.ts';

const app = TestApp.reference();

describe('the reference app', () => {
	it('passes oxlint', () => {
		expect(app.oxlint()).toEqual([]);
	});

	it('passes dependency-cruiser', () => {
		expect(app.dependencyCruiser()).toEqual([]);
	});
});
