import { appendFileSync, cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const skeleton = fileURLToPath(new URL('../../../skills/alveolus-design/skeleton.md', import.meta.url));
const deposit = fileURLToPath(new URL('deposit-design.md', import.meta.url));
const notes = fileURLToPath(new URL('work', import.meta.url));

export class WorkFolder {
	readonly #path: string;

	private constructor(path: string) {
		this.#path = path;
	}

	public static deposit(): WorkFolder {
		const path = mkdtempSync(join(tmpdir(), 'alveolus-work-'));
		const frontmatter = /^---\n[\s\S]*?\n---\n/.exec(readFileSync(deposit, 'utf8'))?.[0] ?? '';
		const text = readFileSync(skeleton, 'utf8')
			.replace(/^---\n[\s\S]*?\n---\n/, frontmatter)
			.replace('# <Title of the story>', '# Deposit money into a wallet');

		cpSync(notes, path, { recursive: true });
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
