import { globSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';

import { registry } from '../registry.ts';

const site = fileURLToPath(new URL('../../../../../docs/src/rules/', import.meta.url));
const triage = readFileSync(new URL('../../../TRIAGE.md', import.meta.url), 'utf8');

const rows = [...triage.matchAll(/^\| ([A-Z]+-\d{2}) \| (full|partial|no) \|/gm)];
const verdicts = new Map(rows.map(([, code, verdict]) => [code, verdict]));
const approvedCodes: string[] = [];

for (const page of globSync('*/*/*.md', { cwd: site })) {
	const { code, review } = matter(readFileSync(`${site}${page}`, 'utf8')).data;

	if (review === 'approved') {
		approvedCodes.push(code);
	}
}

describe('TRIAGE.md', () => {
	it('gives every approved rule of the site exactly one verdict', () => {
		expect(rows).toHaveLength(verdicts.size);
		expect([...verdicts.keys()].toSorted()).toEqual(approvedCodes.toSorted());
	});

	it.each(registry.map((fitnessFunction) => fitnessFunction.rule))(
		'$code declares the coverage of its row',
		(rule) => {
			expect(rule.coverage).toBe(verdicts.get(rule.code));
		},
	);
});
