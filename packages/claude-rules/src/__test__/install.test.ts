import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

import { DesignBundles } from './support/design-bundles.ts';

type PackagedRule = {
	readonly code: string;
	readonly part: string;
	readonly style: readonly string[];
};

const packageDir = fileURLToPath(new URL('../../', import.meta.url));
const styles = ['tactical', 'transaction-script'];
let app: string;
let rules: readonly PackagedRule[];

beforeAll(() => {
	execFileSync('node', ['scripts/generate.ts'], { cwd: packageDir, stdio: 'ignore' });
	rules = JSON.parse(readFileSync(join(packageDir, 'generated', 'rules.json'), 'utf8')).rules;
	app = mkdtempSync(join(tmpdir(), 'alveolus-install-'));
	writeFileSync(
		join(app, 'architecture.json'),
		JSON.stringify({ contexts: { wallets: 'tactical', notifications: 'transaction-script' } }),
	);
	execFileSync('node', [join(packageDir, 'bin', 'alveolus-claude.js'), 'install'], { cwd: app, stdio: 'ignore' });
});

describe('install', () => {
	it.each(styles)('puts each approved %s rule in exactly one design bundle, the one of its part', (style) => {
		const bundles = new DesignBundles(app, style);
		const expected = rules.filter((rule) => rule.style.includes(style));

		expect(bundles.allCodes().toSorted()).toEqual(expected.map((rule) => rule.code).toSorted());

		for (const rule of expected) {
			expect(bundles.codesOf(rule.part)).toContain(rule.code);
		}
	});

	it('keeps the design bundles out of the rules Claude Code loads on its own', () => {
		expect(existsSync(join(app, '.claude', 'rules', 'alveolus', 'design'))).toBe(false);
		expect(existsSync(join(app, '.claude', 'alveolus', 'design', 'tactical', 'domain-logic.md'))).toBe(true);
	});

	it('writes no domain-logic bundle of tactical rules for transaction script contexts', () => {
		const codes = new DesignBundles(app, 'transaction-script').codesOf('domain-logic');
		const tacticalOnly = rules
			.filter((rule) => !rule.style.includes('transaction-script'))
			.map((rule) => rule.code);

		expect(codes.filter((code) => tacticalOnly.includes(code))).toEqual([]);
	});
});
