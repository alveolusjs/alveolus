export class TransactionScope {
	#refused = false;

	public get refused(): boolean {
		return this.#refused;
	}

	public refuse(): void {
		this.#refused = true;
	}
}
