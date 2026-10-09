import { globSync, readFileSync } from "node:fs";
import { join, sep } from "node:path";

import { Page } from "./page.ts";

export type Match = { readonly page: Page } | { readonly candidates: readonly string[] };

export class Docs {
	public static readonly sections: readonly string[] = ["guide", "integrations", "core", "rules"];

	public constructor(private readonly dir: string) {}

	public topics(): string[] {
		const topics: string[] = [];
		for (const section of Docs.sections) {
			for (const file of globSync("**/*.md", { cwd: join(this.dir, section) }).sort()) {
				topics.push(this.topicOf(join(section, file)));
			}
		}
		return topics.sort();
	}

	public find(name: string): Match {
		const wanted = name.replace(/\.md$/, "").replace(/\/$/, "").replace(/\\/g, "/");
		const candidates = this.topics().filter((topic) => topic === wanted || topic.endsWith(`/${wanted}`));
		const exact = candidates.find((topic) => topic === wanted);
		if (exact !== undefined) {
			return { page: this.read(exact) };
		}
		if (candidates.length === 1 && candidates[0] !== undefined) {
			return { page: this.read(candidates[0]) };
		}
		return { candidates };
	}

	public read(topic: string): Page {
		const path = join(this.dir, ...topic.split("/"));
		try {
			return new Page(topic, readFileSync(`${path}.md`, "utf8"));
		} catch {
			return new Page(topic, readFileSync(join(path, "index.md"), "utf8"));
		}
	}

	private topicOf(file: string): string {
		return file
			.split(sep)
			.join("/")
			.replace(/\.md$/, "")
			.replace(/\/index$/, "");
	}
}
