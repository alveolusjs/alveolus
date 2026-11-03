import type { DesignDocument, Frontmatter } from '../design-document.ts';
import type { Finding } from '../finding.ts';

const types = ['story', 'task'];
const statuses = ['draft', 'approved', 'in-progress', 'implemented', 'reviewed'];
const styles = ['tactical', 'transaction-script', 'big-ball-of-mud'];
const subdomains = ['core', 'supporting', 'generic'];
const rulesVersion = /^@alveolus\/claude-rules \d+\.\d+\.\d+/;

type Fields = { readonly [key: string]: unknown };

export class FrontmatterCheck {
	readonly #frontmatter: Frontmatter | undefined;

	public constructor(document: DesignDocument) {
		this.#frontmatter = document.frontmatter;
	}

	public findings(): Finding[] {
		if (this.#frontmatter === undefined) {
			return [{ line: 1, message: 'the design has no frontmatter' }];
		}

		if (this.#frontmatter.error !== undefined) {
			return [{ line: 1, message: `the frontmatter is not valid YAML: ${this.#frontmatter.error}` }];
		}

		const fields = this.#fieldsOf(this.#frontmatter.data);

		if (fields === undefined) {
			return [{ line: 1, message: 'the frontmatter is not a map of fields' }];
		}

		return [
			...this.#text(fields, 'title'),
			...this.#oneOf(fields, 'type', types),
			...this.#text(fields, 'source'),
			...this.#oneOf(fields, 'status', statuses),
			...this.#version(fields),
			...this.#contexts(fields),
			...this.#rules(fields),
		];
	}

	#text(fields: Fields, key: string): Finding[] {
		const value = fields[key];

		if (typeof value === 'string' && value.trim() !== '') {
			return [];
		}

		return [this.#finding(key, `${key} must be a non-empty text`)];
	}

	#oneOf(fields: Fields, key: string, values: readonly string[]): Finding[] {
		const value = fields[key];

		if (typeof value === 'string' && values.includes(value)) {
			return [];
		}

		return [this.#finding(key, `${key} is "${String(value)}", expected one of ${values.join(', ')}`)];
	}

	#version(fields: Fields): Finding[] {
		const value = fields['version'];

		if (Number.isInteger(value) && Number(value) >= 1) {
			return [];
		}

		return [this.#finding('version', 'version must be a whole number from 1')];
	}

	#contexts(fields: Fields): Finding[] {
		const value = fields['contexts'];

		if (!Array.isArray(value) || value.length === 0) {
			return [this.#finding('contexts', 'contexts must list each bounded context touched')];
		}

		const findings: Finding[] = [];

		for (const [index, entry] of value.entries()) {
			findings.push(...this.#context(this.#fieldsOf(entry), index + 1));
		}

		return findings;
	}

	#context(context: Fields | undefined, position: number): Finding[] {
		const label = `contexts, entry ${position}`;

		if (context === undefined) {
			return [this.#finding('contexts', `${label} must have a name, a style, a subdomain and new`)];
		}

		const findings: Finding[] = [];
		const { name, style, subdomain } = context;

		if (typeof name !== 'string' || name.trim() === '') {
			findings.push(this.#finding('contexts', `${label}: name must be a non-empty text`));
		}

		if (typeof style !== 'string' || !styles.includes(style)) {
			findings.push(this.#finding('contexts', `${label}: style must be one of ${styles.join(', ')}`));
		}

		if (typeof subdomain !== 'string' || !subdomains.includes(subdomain)) {
			findings.push(this.#finding('contexts', `${label}: subdomain must be one of ${subdomains.join(', ')}`));
		}

		if (typeof context['new'] !== 'boolean') {
			findings.push(this.#finding('contexts', `${label}: new must be true or false`));
		}

		return findings;
	}

	#rules(fields: Fields): Finding[] {
		const value = fields['rules'];

		if (typeof value === 'string' && rulesVersion.test(value)) {
			return [];
		}

		return [this.#finding('rules', 'rules must name the installed version: "@alveolus/claude-rules <x.y.z>"')];
	}

	#fieldsOf(value: unknown): Fields | undefined {
		if (typeof value !== 'object' || value === null || Array.isArray(value)) {
			return undefined;
		}

		return Object.fromEntries(Object.entries(value));
	}

	#finding(key: string, message: string): Finding {
		return { line: this.#frontmatter?.keyLines.get(key) ?? 1, message: `frontmatter: ${message}` };
	}
}
