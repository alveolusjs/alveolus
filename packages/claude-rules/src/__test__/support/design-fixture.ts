import { readFileSync } from 'node:fs';

export class DesignFixture {
	readonly #text: string;

	private constructor(text: string) {
		this.#text = text;
	}

	public static deposit(): DesignFixture {
		return new DesignFixture(readFileSync(new URL('deposit-design.md', import.meta.url), 'utf8'));
	}

	public get text(): string {
		return this.#text;
	}

	public replace(fragment: string, replacement: string): DesignFixture {
		if (!this.#text.includes(fragment)) {
			throw new Error(`The design has no "${fragment}"`);
		}

		return new DesignFixture(this.#text.replace(fragment, replacement));
	}

	public remove(fragment: string): DesignFixture {
		return this.replace(fragment, '');
	}

	public translateHeadings(): DesignFixture {
		const translated = this.#text
			.replace(/^## Summary$/m, '## Résumé')
			.replaceAll(/^(#{1,3} (?:Part )?[\dA-Z]+(?:\.\d+)?\.? )[^\n:]*$/gm, '$1Titre traduit');

		return new DesignFixture(translated);
	}

	public lineOf(fragment: string): number {
		const index = this.#text.indexOf(fragment);

		if (index === -1) {
			throw new Error(`The design has no "${fragment}"`);
		}

		return this.#text.slice(0, index).split('\n').length;
	}
}
