import type { DesignDocument, TextLine } from '../design-document.ts';
import type { Finding } from '../finding.ts';

const placeholder = /<(\p{L}[^<>\n]*)>/gu;
const inlineCode = /`[^`]*`/g;
const htmlTag =
	/^\/?(a|b|br|code|del|details|div|em|hr|i|img|kbd|li|mark|ol|p|s|small|span|strong|sub|summary|sup|u|ul)(\s[^<>]*)?\/?$/i;
const autolink = /^(https?|mailto):/i;

export class LeftoverCheck {
	readonly #document: DesignDocument;

	public constructor(document: DesignDocument) {
		this.#document = document;
	}

	public findings(): Finding[] {
		return [...this.#comments(), ...this.#placeholders()];
	}

	#comments(): Finding[] {
		const titleLine = this.#document.titleLine ?? 0;

		return this.#document.commentLines
			.filter((line) => line > titleLine)
			.map((line) => ({ line, message: 'help comment left: remove it once its section is filled' }));
	}

	#placeholders(): Finding[] {
		const lines = [...(this.#document.frontmatter?.values ?? []), ...this.#document.textLines];
		const findings: Finding[] = [];

		for (const textLine of lines) {
			if (!textLine.mermaid) {
				findings.push(...this.#placeholdersIn(textLine));
			}
		}

		return findings;
	}

	#placeholdersIn({ line, text }: TextLine): Finding[] {
		const findings: Finding[] = [];

		for (const match of text.replaceAll(inlineCode, '').matchAll(placeholder)) {
			const content = match[1] ?? '';

			if (!htmlTag.test(content) && !autolink.test(content)) {
				findings.push({ line, message: `placeholder left: ${match[0]}` });
			}
		}

		return findings;
	}
}
