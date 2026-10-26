export class Rule {
	public readonly code: string;
	public readonly title: string;
	public readonly url: string;

	public constructor(code: string, title: string, url: string) {
		this.code = code;
		this.title = title;
		this.url = url;
	}

	public describe(): string {
		return `${this.code} · ${this.title} ${this.url}`;
	}
}
