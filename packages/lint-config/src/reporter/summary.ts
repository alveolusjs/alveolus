export class Summary {
	readonly #errors: number;
	readonly #warnings: number;

	public constructor(errors: number, warnings: number) {
		this.#errors = errors;
		this.#warnings = warnings;
	}

	public toString(): string {
		return `Found ${this.#count(this.#warnings, 'warning')} and ${this.#count(this.#errors, 'error')}.`;
	}

	#count(total: number, noun: string): string {
		return `${total} ${noun}${total === 1 ? '' : 's'}`;
	}
}
