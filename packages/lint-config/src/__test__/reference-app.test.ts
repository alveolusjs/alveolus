import { describe, expect, it } from 'vitest';

import { TestApp } from './support/test-app.ts';

const app = TestApp.reference();

describe('the reference app', () => {
	it('passes ESLint', () => {
		expect(app.eslint()).toEqual([]);
	});

	it('passes dependency-cruiser', () => {
		expect(app.dependencyCruiser()).toEqual([]);
	});
});
