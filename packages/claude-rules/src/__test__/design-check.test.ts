import { beforeAll, describe, expect, it } from 'vitest';

import { DesignCheck } from '../design/design-check.ts';
import { MermaidParser } from '../design/mermaid-parser.ts';
import { RuleCatalog } from '../design/rule-catalog.ts';
import { DesignFixture } from './support/design-fixture.ts';

const catalog = new RuleCatalog(['AGG-01', 'AGG-06', 'COV-02', 'UC-01']);
const deposit = DesignFixture.deposit();
let check: DesignCheck;

beforeAll(async () => {
	const parser = await MermaidParser.load();

	expect(parser).toBeDefined();
	check = new DesignCheck(catalog, parser);
});

describe('design check', () => {
	it('passes a complete design', async () => {
		const report = await check.run(deposit.text);

		expect(report).toEqual({ findings: [], notices: [] });
	});

	it('finds sections by their number, whatever the language of their headings', async () => {
		const report = await check.run(deposit.translateHeadings().text);

		expect(report.findings).toEqual([]);
	});

	describe('sections', () => {
		it('reports a missing section', async () => {
			const design = deposit.remove(
				"## 3. Out of scope\n\nDeposits in another currency than the wallet's. Fees.\n",
			);
			const report = await check.run(design.text);

			expect(report.findings).toEqual([
				{ line: design.lineOf('# Deposit money'), message: 'section 3 is missing' },
			]);
		});

		it('reports an empty section', async () => {
			const design = deposit.replace('## 12. External integrations\n\nNone.\n', '## 12. External integrations\n');
			const report = await check.run(design.text);

			expect(report.findings).toEqual([
				{
					line: design.lineOf('## 12.'),
					message: 'section 12 is empty: write "None." when there is nothing to say',
				},
			]);
		});

		it('reports a table left with no rows', async () => {
			const design = deposit.replace(
				'### For the tech team\n\nNone.',
				'### For the tech team\n\n| ID | Question | Assumption meanwhile | Blocks |\n| --- | --- | --- | --- |',
			);
			const report = await check.run(design.text);

			expect(report.findings).toEqual([
				{
					line: design.lineOf('### For the tech team') + 2,
					message: 'the table has no rows: fill it, or write "None." in its place',
				},
			]);
		});

		it('reports a section out of order', async () => {
			const design = deposit
				.remove('## 12. External integrations\n\nNone.\n\n')
				.replace('## 14. Increments', '## 12. External integrations\n\nNone.\n\n## 14. Increments');
			const report = await check.run(design.text);

			expect(report.findings).toEqual([
				{ line: design.lineOf('## 12. External'), message: 'section 12 is out of order' },
			]);
		});
	});

	describe('identifiers', () => {
		it('reports an identifier cited but never defined', async () => {
			const design = deposit.replace(
				'No other context is called.',
				'No other context is called, unlike UC:Withdraw.',
			);
			const report = await check.run(design.text);

			expect(report.findings).toEqual([
				{
					line: design.lineOf('unlike UC:Withdraw'),
					message: 'UC:Withdraw is cited but never defined: define it in a table row of section 9',
				},
			]);
		});

		it('reports an identifier defined twice', async () => {
			const row = '| AC-1 | | Alice deposits 50.00 EUR into W1 | The balance of W1 is 150.00 EUR |';
			const design = deposit.replace(row, `${row}\n${row}`);
			const report = await check.run(design.text);
			const first = design.lineOf(row);

			expect(report.findings).toEqual([
				{
					line: first + 1,
					message: `AC-1 is defined 2 times, at lines ${first}, ${first + 1}: define it once`,
				},
			]);
		});

		it('defines an aggregate only in a heading of section 7', async () => {
			const design = deposit.replace(
				'### 7.1 wallets: AGG:Wallet (existing, changed)',
				'### 7.1 wallets: the wallet',
			);
			const report = await check.run(design.text);

			expect(report.findings).toEqual([
				{
					line: design.lineOf('AGG:Wallet'),
					message: 'AGG:Wallet is cited but never defined: define it in a heading of section 7',
				},
			]);
		});

		it('reads an increment cited in appendix A as a citation', async () => {
			const design = deposit.replace(
				'| I4 | wallets | The deposit route |',
				'| I5 | wallets | The deposit route |',
			);
			const report = await check.run(design.text);

			expect(report.findings).toEqual([
				{
					line: design.lineOf('| I4 | `src/wallets'),
					message: 'I4 is cited but never defined: define it in a table row of section 14',
				},
			]);
		});

		it('reports an acceptance criterion that no test proves', async () => {
			const design = deposit
				.replace('| T-3 | AC-1 |', '| T-3 | INV-1 |')
				.replace('| T-5 | AC-1, AC-2, AC-3, AC-4 |', '| T-5 | AC-2, AC-3, AC-4 |');
			const report = await check.run(design.text);

			expect(report.findings).toEqual([
				{
					line: design.lineOf('| AC-1 |'),
					message: 'AC-1 is proven by no test: cite it in the Proves column of a T row in section 15',
				},
			]);
		});

		it('reports an invariant that no test proves', async () => {
			const design = deposit.replace('| T-1 | INV-1, AC-2 |', '| T-1 | AC-2 |');
			const report = await check.run(design.text);

			expect(report.findings).toEqual([
				{
					line: design.lineOf('| INV-1 |'),
					message: 'INV-1 is proven by no test: cite it in the Proves column of a T row in section 15',
				},
			]);
		});

		it('reports a decision without a reason', async () => {
			const design = deposit.replace('| A replay is detected in the same transaction as the credit |', '| |');
			const report = await check.run(design.text);

			expect(report.findings).toEqual([{ line: design.lineOf('| D-1 |'), message: 'D-1: Why is empty' }]);
		});

		it('reports a question without an assumption', async () => {
			const design = deposit.replace('| No maximum |', '| |');
			const report = await check.run(design.text);

			expect(report.findings).toEqual([
				{ line: design.lineOf('| Q-1 |'), message: 'Q-1: Assumption meanwhile is empty' },
			]);
		});

		it('reports an increment that does not say why it is safe', async () => {
			const design = deposit.replace('| The migration only adds a table |', '| |');
			const report = await check.run(design.text);

			expect(report.findings).toEqual([{ line: design.lineOf('| I3 |'), message: 'I3: Safe because is empty' }]);
		});

		it('reports an increment state other than todo or done', async () => {
			const design = deposit.replace(
				'| T-3 passes | Not reachable yet | todo |',
				'| T-3 passes | Not reachable yet | wip |',
			);
			const report = await check.run(design.text);

			expect(report.findings).toEqual([
				{ line: design.lineOf('| I2 |'), message: 'I2: State is "wip", expected todo or done' },
			]);
		});

		it('reports a definition row with missing cells', async () => {
			const design = deposit.replace(
				'| D-2 | The customer app generates the deposit id | A retry after a timeout carries the same id |',
				'| D-2 | The customer app generates the deposit id |',
			);
			const report = await check.run(design.text.replace(/(\| D-2 \|[^|\n]*\|)[^\n]*/, '$1'));

			expect(report.findings).toEqual([
				{ line: design.lineOf('| D-2 |'), message: 'D-2: the row has 2 cells, 5 expected' },
			]);
		});
	});

	describe('leftovers', () => {
		it('reports a help comment left after the title', async () => {
			const design = deposit.replace(
				'## 3. Out of scope\n',
				'## 3. Out of scope\n\n<!-- What the story leaves out. -->\n',
			);
			const report = await check.run(design.text);

			expect(report.findings).toEqual([
				{
					line: design.lineOf('<!-- What the story'),
					message: 'help comment left: remove it once its section is filled',
				},
			]);
		});

		it('reports a placeholder left in the text and in the frontmatter', async () => {
			const design = deposit
				.replace('Deposits in another currency', 'Deposits in <currency>')
				.replace('rules: "@alveolus/claude-rules 0.5.0"', 'rules: "@alveolus/claude-rules <version>"');
			const report = await check.run(design.text);

			expect(report.findings).toEqual([
				{
					line: design.lineOf('rules:'),
					message: 'frontmatter: rules must name the installed version: "@alveolus/claude-rules <x.y.z>"',
				},
				{ line: design.lineOf('rules:'), message: 'placeholder left: <version>' },
				{ line: design.lineOf('<currency>'), message: 'placeholder left: <currency>' },
			]);
		});
	});

	describe('frontmatter', () => {
		it('reports a design without frontmatter', async () => {
			const report = await check.run(deposit.text.replace(/^---\n[\s\S]*?\n---\n/, ''));

			expect(report.findings).toEqual([{ line: 1, message: 'the design has no frontmatter' }]);
		});

		it('reports fields out of their values', async () => {
			const design = deposit
				.replace('type: story', 'type: epic')
				.replace('status: draft', 'status: done')
				.replace('version: 1', 'version: one')
				.replace('    subdomain: core', '    subdomain: central');
			const report = await check.run(design.text);

			expect(report.findings).toEqual([
				{ line: 3, message: 'frontmatter: type is "epic", expected one of story, task' },
				{
					line: 5,
					message:
						'frontmatter: status is "done", expected one of draft, approved, in-progress, implemented, reviewed',
				},
				{ line: 6, message: 'frontmatter: version must be a whole number from 1' },
				{
					line: 7,
					message: 'frontmatter: contexts, entry 1: subdomain must be one of core, supporting, generic',
				},
			]);
		});
	});

	describe('rules', () => {
		it('reports a rule code that is not an approved rule', async () => {
			const design = deposit.replace('| UC-01 | UC:DepositMoney |', '| AGG-99 | UC:DepositMoney |');
			const report = await check.run(design.text);
			const line = design.lineOf('| AGG-99 |');

			expect(report.findings).toEqual([
				{ line, message: 'AGG-99 is not an approved Alveolus rule' },
				{ line, message: 'appendix B lists "AGG-99", which is not an approved Alveolus rule code' },
			]);
		});
	});

	describe('diagrams', () => {
		it('reports a Mermaid diagram that does not parse, at its line', async () => {
			const design = deposit.replace('  wallet ||--o{ deposit : "wallet_id"', '  wallet ||--o{ deposit');
			const report = await check.run(design.text);

			expect(report.findings).toEqual([
				{
					line: design.lineOf('  wallet ||--o{ deposit\n'),
					message:
						"the Mermaid diagram does not parse: Parse error on line 11: Expecting 'COLON', 'STYLE_SEPARATOR', got 'NEWLINE'",
				},
			]);
		});

		it('reports a summary without a context map', async () => {
			const design = deposit.replace('```mermaid\nflowchart LR', '```text\nflowchart LR');
			const report = await check.run(design.text);

			expect(report.findings).toEqual([
				{ line: design.lineOf('## Summary'), message: 'the summary has no context map: a Mermaid flowchart' },
			]);
		});

		it('reports a table defined without an entity diagram', async () => {
			const design = deposit.replace('```mermaid\nerDiagram', '```text\nerDiagram');
			const report = await check.run(design.text);

			expect(report.findings).toEqual([
				{
					line: design.lineOf('## 11. Data'),
					message: 'section 11 defines a table but has no Mermaid erDiagram',
				},
			]);
		});

		it('notes that diagrams are not checked when Mermaid is not installed', async () => {
			const report = await new DesignCheck(catalog, undefined).run(deposit.text);

			expect(report).toEqual({
				findings: [],
				notices: [
					'Mermaid diagrams not checked: add mermaid and happy-dom to the dev dependencies to check them',
				],
			});
		});
	});
});
