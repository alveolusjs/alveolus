interface Replacement {
	readonly pattern: RegExp;
	readonly text: string;
}

const html: readonly Replacement[] = [
	{ pattern: /<dt>/g, text: "- " },
	{ pattern: /<\/dt>\s*<dd>/g, text: ": " },
	{ pattern: /<[^>\n]+>/g, text: "" },
	{ pattern: /^\t+- /gm, text: "- " },
	{ pattern: /&lt;/g, text: "<" },
	{ pattern: /&gt;/g, text: ">" },
	{ pattern: /&amp;/g, text: "&" },
];

const frontmatter = /^---\n([\s\S]*?)\n---\n/;

export class Page {
	public constructor(
		public readonly topic: string,
		private readonly source: string,
	) {}

	public get description(): string {
		const header = frontmatter.exec(this.source)?.[1] ?? "";
		const description = /^description: "?(.*?)"?$/m.exec(header)?.[1] ?? "";
		return description;
	}

	public text(): string {
		let text = this.source.replace(frontmatter, "");
		for (const { pattern, text: replacement } of html) {
			text = text.replace(pattern, replacement);
		}
		return `${text.replace(/\n{3,}/g, "\n\n").trim()}\n`;
	}
}
