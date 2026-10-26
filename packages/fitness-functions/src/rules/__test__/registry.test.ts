import { existsSync, globSync, readFileSync } from 'node:fs';
import { sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';

import { registry } from '../registry.ts';

const rules = fileURLToPath(new URL('../', import.meta.url));
const site = fileURLToPath(new URL('../../../../../docs/src/rules/', import.meta.url));

const themeFolders = globSync('*/*/index.ts', { cwd: rules }).map((path) => path.split(sep).slice(0, 2).join('/'));
const ruleFolders = globSync('*/*/*/*.ts', { cwd: rules }).map((path) => path.split(sep).slice(0, 3).join('/'));
const registeredRules = registry.map((fitnessFunction) => fitnessFunction.rule);

describe('registry', () => {
	it.each(themeFolders)('%s is a theme of the site', (theme) => {
		expect(existsSync(`${site}${theme}/index.md`)).toBe(true);
	});

	it.each(ruleFolders)('%s automates an approved rule of the site, with its title, url and styles', (folder) => {
		const { code, title, review, style } = matter(readFileSync(`${site}${folder}.md`, 'utf8')).data;
		const rule = registeredRules.find((registered) => registered.code === code);

		expect(review).toBe('approved');
		expect(rule?.title).toBe(title);
		expect(rule?.url).toBe(`https://alveolus.dev/rules/${folder}`);
		expect(rule?.styles.toSorted()).toEqual([...style].sort());
	});

	it('registers the fitness function of every rule folder, under the code of its folder', () => {
		const registeredCodes = registeredRules.map((rule) => rule.code);
		const folderCodes = ruleFolders.map((folder) => folder.split('/')[2]?.toUpperCase());

		expect(registeredCodes.toSorted()).toEqual(folderCodes.toSorted());
	});
});
