import { globSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';

import dependencyCruiser from '../dependency-cruiser.ts';
import oxlint from '../oxlint.ts';
import type { Rule } from '../rule.ts';
import { rules } from '../rules.ts';

const site = fileURLToPath(new URL('../../../../docs/src/rules/', import.meta.url));
const oxlintMessages = JSON.stringify(oxlint);
const dependencyCruiserRules = (dependencyCruiser.forbidden ?? []).map((forbidden) => forbidden.name);
const linters = ['dependency-cruiser', 'oxlint'];
const pages = new Map<
	string,
	{ readonly title: string; readonly review: string; readonly detection: string[]; readonly path: string }
>();

for (const path of globSync('*/*/*-*.md', { cwd: site })) {
	const { code, title, review, detection } = matter(readFileSync(`${site}${path}`, 'utf8')).data;
	pages.set(code, { title, review, detection, path: path.replaceAll('\\', '/').replace(/\.md$/, '') });
}

class Detection {
	readonly #rule: Rule;

	public constructor(rule: Rule) {
		this.#rule = rule;
	}

	public tools(): string[] {
		const tools: string[] = [];

		if (dependencyCruiserRules.includes(this.#rule.code)) {
			tools.push('dependency-cruiser');
		}

		if (oxlintMessages.includes(`${this.#rule.code} · `)) {
			tools.push('oxlint');
		}

		return tools;
	}
}

describe('the rules', () => {
	it.each(rules)('$code is an approved rule of the site, with its title and url', (rule) => {
		const page = pages.get(rule.code);

		expect(page?.review).toBe('approved');
		expect(rule.title).toBe(page?.title);
		expect(rule.url).toBe(`https://alveolus.dev/rules/${page?.path}`);
	});

	it.each(rules)('$code names in its detection the tools that check it', (rule) => {
		expect(pages.get(rule.code)?.detection).toEqual(new Detection(rule).tools());
	});

	it('are the only rules of the site that name these tools in their detection', () => {
		const detected: string[] = [];

		for (const [code, page] of pages) {
			if (page.detection.some((tool) => linters.includes(tool))) {
				detected.push(code);
			}
		}

		expect(detected.toSorted()).toEqual(rules.map((rule) => rule.code).toSorted());
	});
});
