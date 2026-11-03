import { readFileSync } from 'node:fs';

type CatalogFile = {
	readonly rules: readonly { readonly code: string }[];
};

export class RuleCatalog {
	readonly #codes: ReadonlySet<string>;
	readonly #prefixes: ReadonlySet<string>;

	public constructor(codes: readonly string[]) {
		this.#codes = new Set(codes);
		this.#prefixes = new Set(codes.map((code) => code.replace(/-\d+$/, '')));
	}

	public static read(file: string): RuleCatalog {
		const content: CatalogFile = JSON.parse(readFileSync(file, 'utf8'));

		return new RuleCatalog(content.rules.map((rule) => rule.code));
	}

	public has(code: string): boolean {
		return this.#codes.has(code);
	}

	public hasPrefix(prefix: string): boolean {
		return this.#prefixes.has(prefix);
	}
}
