import { describe, expect, it } from 'vitest';

import { CodeFrame } from '../reporter/code-frame.ts';

describe('CodeFrame', () => {
	it('finds an import written with single quotes, double quotes or backquotes', () => {
		const frame = new CodeFrame(
			'a.ts',
			[`import a from 'a';`, `import b from "b";`, 'const c = import(`c`);'].join('\n'),
		);

		expect(frame.locate('a')).toEqual({ line: 1, column: 15, length: 3 });
		expect(frame.locate('b')).toEqual({ line: 2, column: 15, length: 3 });
		expect(frame.locate('c')).toEqual({ line: 3, column: 18, length: 3 });
	});

	it('finds nothing for an import it cannot read', () => {
		expect(new CodeFrame('a.ts', `import a from 'a';`).locate('b')).toBeUndefined();
	});

	it('shows no line before the first one, and widens the margin with the line numbers', () => {
		const lines = Array.from({ length: 10 }, (_, index) => `const v${index} = ${index};`);
		lines[9] = `import a from 'a';`;
		const frame = new CodeFrame('a.ts', lines.join('\n'));
		const span = frame.locate('a');

		expect(new CodeFrame('b.ts', `import a from 'a';`).render({ column: 15, length: 3, line: 1 }, 'a.ts')[1]).toBe(
			` 1 │ import a from 'a';`,
		);
		expect(span === undefined ? [] : frame.render(span, 'a.ts')).toEqual([
			'    ╭─[a.ts:10:15]',
			'  9 │ const v8 = 8;',
			` 10 │ import a from 'a';`,
			'    ·               ─┬─',
			'    ·                ╰── a.ts',
			'    ╰────',
		]);
	});
});
