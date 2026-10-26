import { describe, expect, it } from 'vitest';

import { Lines } from '../lines.ts';

const lines = new Lines('first\nsecond\n\nfourth');

describe('Lines', () => {
	it('gives the line of an offset, counted from one', () => {
		expect(lines.at(0)).toBe(1);
		expect(lines.at(5)).toBe(1);
		expect(lines.at(6)).toBe(2);
		expect(lines.at(13)).toBe(3);
		expect(lines.at(14)).toBe(4);
		expect(lines.at(19)).toBe(4);
	});
});
