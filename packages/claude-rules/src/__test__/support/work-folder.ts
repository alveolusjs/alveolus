import { appendFileSync, cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontmatter = /^---\n[\s\S]*?\n---\n/;

export class WorkFolder {
	readonly #path: string;

	private constructor(path: string) {
		this.#path = path;
	}

	public static deposit(): WorkFolder {
		return WorkFolder.#create('skeleton.md', 'deposit-design.md', 'work', [
			'<Title of the story>',
			'Deposit money into a wallet',
		]);
	}

	public static savingsEpic(): WorkFolder {
		return WorkFolder.#create('epic-skeleton.md', 'savings-epic-design.md', 'epic-work', [
			'<Title of the epic>',
			'Savings goals',
		]);
	}

	static #create(skeleton: string, design: string, notes: string, title: readonly [string, string]): WorkFolder {
		const path = mkdtempSync(join(tmpdir(), 'alveolus-work-'));
		const skeletonFile = fileURLToPath(new URL(`../../../skills/alveolus-design/${skeleton}`, import.meta.url));
		const designFile = fileURLToPath(new URL(design, import.meta.url));
		const filled = frontmatter.exec(readFileSync(designFile, 'utf8'))?.[0] ?? '';
		const text = readFileSync(skeletonFile, 'utf8').replace(frontmatter, filled).replace(title[0], title[1]);

		cpSync(fileURLToPath(new URL(notes, import.meta.url)), path, { recursive: true });
		writeFileSync(join(path, 'skeleton.md'), text);

		return new WorkFolder(path);
	}

	public get path(): string {
		return this.#path;
	}

	public append(agent: string, text: string): WorkFolder {
		appendFileSync(join(this.#path, `${agent}.md`), `\n${text}\n`);

		return this;
	}
}
