import type { HeadConfig, PageData } from "vitepress";

/**
 * The tags search engines and link previews read from one page: its canonical URL, its Open Graph
 * and Twitter card, and its JSON-LD description.
 */
export class PageHead {
	public static readonly hostname = "https://alveolus.dev";
	private static readonly siteName = "Alveolus";
	private static readonly image = `${PageHead.hostname}/og.png`;
	private static readonly repository = "https://github.com/alveolusjs/alveolus";

	private readonly page: PageData;

	public constructor(page: PageData) {
		this.page = page;
	}

	public tags(): HeadConfig[] {
		const url = this.url();
		const title = this.title();
		const description = this.page.description;

		return [
			["link", { href: url, rel: "canonical" }],
			["meta", { content: PageHead.siteName, property: "og:site_name" }],
			["meta", { content: this.isHome() ? "website" : "article", property: "og:type" }],
			["meta", { content: url, property: "og:url" }],
			["meta", { content: title, property: "og:title" }],
			["meta", { content: description, property: "og:description" }],
			["meta", { content: PageHead.image, property: "og:image" }],
			["meta", { content: "1200", property: "og:image:width" }],
			["meta", { content: "630", property: "og:image:height" }],
			["meta", { content: "summary_large_image", name: "twitter:card" }],
			["meta", { content: title, name: "twitter:title" }],
			["meta", { content: description, name: "twitter:description" }],
			["meta", { content: PageHead.image, name: "twitter:image" }],
			["script", { type: "application/ld+json" }, JSON.stringify(this.structuredData(url, title))],
		];
	}

	private isHome(): boolean {
		return this.page.relativePath === "index.md";
	}

	private url(): string {
		const path = this.page.relativePath.replace(/(^|\/)index\.md$/, "$1").replace(/\.md$/, "");
		return `${PageHead.hostname}/${path}`;
	}

	private title(): string {
		if (this.isHome()) {
			return this.page.title;
		}
		return `${this.page.title} | ${PageHead.siteName}`;
	}

	private structuredData(url: string, title: string): object {
		if (this.isHome()) {
			return {
				"@context": "https://schema.org",
				"@type": "SoftwareSourceCode",
				codeRepository: PageHead.repository,
				description: this.page.description,
				license: "https://opensource.org/licenses/MIT",
				name: PageHead.siteName,
				programmingLanguage: "TypeScript",
				url,
			};
		}
		return {
			"@context": "https://schema.org",
			"@type": "TechArticle",
			dateModified: this.lastUpdated(),
			description: this.page.description,
			headline: title,
			image: PageHead.image,
			isPartOf: { "@type": "WebSite", name: PageHead.siteName, url: PageHead.hostname },
			url,
		};
	}

	private lastUpdated(): string | undefined {
		if (this.page.lastUpdated === undefined) {
			return undefined;
		}
		return new Date(this.page.lastUpdated).toISOString();
	}
}
