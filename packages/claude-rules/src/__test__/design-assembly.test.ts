import { beforeAll, describe, expect, it } from 'vitest';

import { DesignAssembly } from '../design/assembly/design-assembly.ts';
import { DesignCheck } from '../design/design-check.ts';
import { MermaidParser } from '../design/mermaid-parser.ts';
import { RuleCatalog } from '../design/rule-catalog.ts';
import { WorkFolder } from './support/work-folder.ts';

let check: DesignCheck;

beforeAll(async () => {
	check = new DesignCheck(new RuleCatalog(['AGG-01', 'AGG-06', 'COV-02', 'UC-01']), await MermaidParser.load());
});

describe('design assemble', () => {
	it('assembles the notes of the agents into a design that passes the check', async () => {
		const { text, warnings } = new DesignAssembly(WorkFolder.deposit().path, 'None.').assemble();
		const report = await check.run(text);

		expect(warnings).toEqual([]);
		expect(report.findings).toEqual([]);
	});

	it('assembles an epic design from its own skeleton', async () => {
		const { text, warnings } = new DesignAssembly(WorkFolder.savingsEpic().path, 'None.').assemble();
		const report = await check.run(text);

		expect(warnings).toEqual([]);
		expect(report.findings).toEqual([]);
		expect(text).toContain('| D-1 | A goal is an aggregate of its own');
	});

	it('renumbers the local identifiers in the order of their definitions', () => {
		const { text } = new DesignAssembly(WorkFolder.deposit().path, 'None.').assemble();

		expect(text).toContain('| D-1 | The wallet keeps the ids of the deposits it credited |');
		expect(text).toContain('| D-2 | The customer app generates the deposit id |');
		expect(text).toContain('| Q-1 | Is there a maximum amount for one deposit? |');
		expect(text).not.toMatch(/\b(D|Q)-[A-Z]\d/);
	});

	it('rewrites every citation of a local identifier', () => {
		const work = WorkFolder.deposit()
			.append('modeler', '<!-- slot: adrs -->\n\n| ADR-M1 | Keep deposit ids in the wallet | AGG-01 | D-M1 |')
			.append(
				'operator',
				'<!-- slot: questions.tech -->\n\n| Q-O1 | Keep the ids for how long? | 1000 deposits | D-M1, ADR-M1 |',
			);
		const { text } = new DesignAssembly(work.path, 'None.').assemble();

		expect(text).toContain('| ADR-1 | Keep deposit ids in the wallet | AGG-01 | D-1 |');
		expect(text).toContain('| Q-2 | Keep the ids for how long? | 1000 deposits | D-1, ADR-1 |');
	});

	it('writes the given text for a slot no agent filled, and drops the header of an empty table', () => {
		const { text } = new DesignAssembly(WorkFolder.deposit().path, 'Aucun.').assemble();

		expect(text).toContain('## 12. External integrations\n\nAucun.');
		expect(text).toContain('### For the tech team\n\nAucun.');
		expect(text).not.toContain('<!-- slot:');
	});

	it('leaves out a slot that is not in the skeleton, and says so', () => {
		const work = WorkFolder.deposit().append('modeler', '<!-- slot: 7.extra -->\n\nA note on the model.');
		const { text, warnings } = new DesignAssembly(work.path, 'None.').assemble();

		expect(text).not.toContain('A note on the model.');
		expect(warnings).toEqual(['modeler.md: the slot "7.extra" is not in the skeleton, its text is left out']);
	});

	it('says when a local identifier is cited but never defined', () => {
		const work = WorkFolder.deposit().append(
			'tester',
			'<!-- slot: questions.tech -->\n\n| Q-T1 | Which database? | The one of the app | D-R9 |',
		);
		const { warnings } = new DesignAssembly(work.path, 'None.').assemble();

		expect(warnings).toEqual(['D-R9 is cited but no agent defines it in a table row']);
	});

	it('keeps the requests between agents out of the design', () => {
		const { text } = new DesignAssembly(WorkFolder.deposit().path, 'None.').assemble();

		expect(text).not.toContain('Prove AC-4 at the repository level');
	});
});
