import type { FileSystemHost } from "ts-morph";

import { dirname, join } from "node:path";

export class PackageNames {
	private readonly cache = new Map<string, string | undefined>();

	public constructor(private readonly fileSystem: FileSystemHost) {}

	public ofFile(path: string): string | undefined {
		return this.ofDirectory(dirname(path));
	}

	private ofDirectory(directory: string): string | undefined {
		if (this.cache.has(directory)) {
			return this.cache.get(directory);
		}
		const name = this.readManifest(directory) ?? this.ofParent(directory);
		this.cache.set(directory, name);
		return name;
	}

	private ofParent(directory: string): string | undefined {
		const parent = dirname(directory);
		return parent === directory ? undefined : this.ofDirectory(parent);
	}

	private readManifest(directory: string): string | undefined {
		const manifest = join(directory, "package.json");
		if (!this.fileSystem.fileExistsSync(manifest)) {
			return undefined;
		}
		const content: { name?: unknown } = JSON.parse(this.fileSystem.readFileSync(manifest));
		return typeof content.name === "string" ? content.name : undefined;
	}
}
