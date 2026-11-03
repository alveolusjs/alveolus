export type Column = {
	readonly index: number;
	readonly name: string;
};

type KindDefinition = {
	readonly prefix: string;
	readonly separator: '-' | '' | ':';
	readonly home: string;
	readonly definedBy: 'row' | 'heading';
	readonly cells?: number;
	readonly required?: readonly Column[];
};

const before = '(?<![\\p{L}\\p{N}_])';
const after = '(?![\\p{L}\\p{N}_])';
const name = '[\\p{L}_][\\p{L}\\p{N}_-]*(?:[./][\\p{L}_][\\p{L}\\p{N}_-]*)*';

export class IdentifierKind {
	readonly #prefix: string;
	readonly #pattern: RegExp;
	readonly #home: string;
	readonly #definedBy: 'row' | 'heading';
	readonly #cells: number;
	readonly #required: readonly Column[];

	public constructor(definition: KindDefinition) {
		this.#prefix = definition.prefix;
		this.#pattern = IdentifierKind.#patternOf(definition);
		this.#home = definition.home;
		this.#definedBy = definition.definedBy;
		this.#cells = definition.cells ?? 1;
		this.#required = definition.required ?? [];
	}

	public get prefix(): string {
		return this.#prefix;
	}

	public get cells(): number {
		return this.#cells;
	}

	public get required(): readonly Column[] {
		return this.#required;
	}

	public find(text: string): string[] {
		return [...text.matchAll(this.#pattern)].map((match) => match[0]);
	}

	public isDefinedByRowIn(section: string | undefined): boolean {
		return this.#definedBy === 'row' && section === this.#home;
	}

	public isDefinedByHeadingIn(section: string | undefined): boolean {
		return this.#definedBy === 'heading' && section === this.#home;
	}

	public is(prefix: string): boolean {
		return this.#prefix === prefix;
	}

	public home(): string {
		const place = /^\d+$/.test(this.#home) ? `section ${this.#home}` : `appendix ${this.#home}`;

		return this.#definedBy === 'heading' ? `a heading of ${place}` : `a table row of ${place}`;
	}

	static #patternOf({ prefix, separator }: KindDefinition): RegExp {
		if (separator === ':') {
			return new RegExp(`${before}${prefix}:${name}`, 'gu');
		}

		return new RegExp(`${before}${prefix}${separator}\\d+${after}`, 'gu');
	}
}

export const identifierKinds: readonly IdentifierKind[] = [
	new IdentifierKind({
		prefix: 'AC',
		separator: '-',
		home: '2',
		definedBy: 'row',
		cells: 4,
		required: [
			{ index: 2, name: 'When' },
			{ index: 3, name: 'Then' },
		],
	}),
	new IdentifierKind({
		prefix: 'S',
		separator: '-',
		home: '2',
		definedBy: 'row',
		cells: 5,
		required: [
			{ index: 1, name: 'Story' },
			{ index: 2, name: 'Value' },
		],
	}),
	new IdentifierKind({
		prefix: 'D',
		separator: '-',
		home: '4',
		definedBy: 'row',
		cells: 5,
		required: [
			{ index: 1, name: 'Decision' },
			{ index: 2, name: 'Why' },
		],
	}),
	new IdentifierKind({
		prefix: 'Q',
		separator: '-',
		home: '5',
		definedBy: 'row',
		cells: 4,
		required: [
			{ index: 1, name: 'Question' },
			{ index: 2, name: 'Assumption meanwhile' },
			{ index: 3, name: 'Blocks' },
		],
	}),
	new IdentifierKind({
		prefix: 'INV',
		separator: '-',
		home: '7',
		definedBy: 'row',
		cells: 4,
		required: [
			{ index: 1, name: 'Invariant' },
			{ index: 2, name: 'Guarded by' },
		],
	}),
	new IdentifierKind({
		prefix: 'T',
		separator: '-',
		home: '15',
		definedBy: 'row',
		cells: 4,
		required: [
			{ index: 1, name: 'Proves' },
			{ index: 2, name: 'File' },
			{ index: 3, name: 'Level' },
		],
	}),
	new IdentifierKind({
		prefix: 'I',
		separator: '',
		home: '14',
		definedBy: 'row',
		cells: 7,
		required: [
			{ index: 2, name: 'Increment' },
			{ index: 3, name: 'Covers' },
			{ index: 4, name: 'Done when' },
			{ index: 5, name: 'Safe because' },
		],
	}),
	new IdentifierKind({
		prefix: 'ADR',
		separator: '-',
		home: 'C',
		definedBy: 'row',
		cells: 2,
		required: [{ index: 1, name: 'Decision' }],
	}),
	new IdentifierKind({
		prefix: 'W',
		separator: '-',
		home: 'B',
		definedBy: 'row',
		cells: 4,
		required: [
			{ index: 1, name: 'Rule' },
			{ index: 2, name: 'Reason' },
			{ index: 3, name: 'What limits the risk' },
		],
	}),
	new IdentifierKind({ prefix: 'AGG', separator: ':', home: '7', definedBy: 'heading', cells: 0 }),
	new IdentifierKind({ prefix: 'VO', separator: ':', home: '7', definedBy: 'row' }),
	new IdentifierKind({ prefix: 'ERR', separator: ':', home: '7', definedBy: 'row' }),
	new IdentifierKind({ prefix: 'EVT', separator: ':', home: '8', definedBy: 'row' }),
	new IdentifierKind({ prefix: 'UC', separator: ':', home: '9', definedBy: 'row' }),
	new IdentifierKind({ prefix: 'QRY', separator: ':', home: '9', definedBy: 'row' }),
	new IdentifierKind({ prefix: 'API', separator: ':', home: '10', definedBy: 'row' }),
	new IdentifierKind({ prefix: 'TBL', separator: ':', home: '11', definedBy: 'heading', cells: 0 }),
];
