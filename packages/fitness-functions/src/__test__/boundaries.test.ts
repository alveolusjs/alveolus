import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { Codebase } from '../codebase/codebase.ts';
import { ProjectRoot } from '../codebase/project-root.ts';

const reads: Readonly<Record<string, readonly string[]>> = {
	codebase: [],
	layout: ['codebase'],
	project: ['codebase', 'layout'],
	rules: ['layout', 'project', 'violations'],
	violations: ['rules'],
};
const syntaxPackages = ['oxc-parser', 'oxc-resolver'];

const codebase = Codebase.read(new ProjectRoot(fileURLToPath(new URL('../../', import.meta.url))), ['src']);

describe('the folders of the package', () => {
	it('depend on each other only in the directions of ARCHITECTURE.md', () => {
		const crossings: string[] = [];

		for (const file of codebase.files) {
			const folder = file.path.split('/')[1] ?? '';
			const allowed = reads[folder];

			if (allowed === undefined) {
				continue;
			}

			for (const dependency of file.dependencies) {
				const target = dependency.target?.startsWith('src/') ? dependency.target.split('/')[1] : undefined;

				if (target !== undefined && target !== folder && !allowed.includes(target)) {
					crossings.push(`${file.path}:${dependency.line} ${folder} reads ${target}`);
				}
			}
		}

		expect(crossings).toEqual([]);
	});

	it('read the syntax of the app only in codebase', () => {
		const readers: string[] = [];

		for (const file of codebase.files) {
			for (const dependency of file.dependencies) {
				if (syntaxPackages.includes(dependency.specifier) && !file.path.startsWith('src/codebase/')) {
					readers.push(`${file.path}:${dependency.line} imports ${dependency.specifier}`);
				}
			}
		}

		expect(readers).toEqual([]);
	});

	it('cover every folder of src', () => {
		const folders = new Set<string>();

		for (const file of codebase.files) {
			const segments = file.path.split('/');

			if (segments.length > 2) {
				folders.add(segments[1] ?? '');
			}
		}

		expect([...folders].toSorted()).toEqual(Object.keys(reads).toSorted());
	});
});
