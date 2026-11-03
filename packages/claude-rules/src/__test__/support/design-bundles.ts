import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export class DesignBundles {
	readonly #folder: string;

	public constructor(app: string, style: string) {
		this.#folder = join(app, '.claude', 'alveolus', 'design', style);
	}

	public parts(): string[] {
		return readdirSync(this.#folder).map((file) => file.replace(/\.md$/, ''));
	}

	public codesOf(part: string): string[] {
		const text = readFileSync(join(this.#folder, `${part}.md`), 'utf8');

		return [...text.matchAll(/^### ([A-Z]+-\d+) · /gm)].map((match) => match[1] ?? '');
	}

	public allCodes(): string[] {
		return this.parts().flatMap((part) => this.codesOf(part));
	}
}
