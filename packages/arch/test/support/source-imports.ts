import { globSync, readFileSync } from "node:fs";
import { dirname, join, normalize, relative, sep } from "node:path";

export interface SourceModule {
	readonly path: string;
	readonly folder: string;
	readonly folders: readonly string[];
	readonly packages: readonly string[];
}

export class SourceImports {
	public constructor(private readonly srcDir: string) {}

	public modules(): SourceModule[] {
		const modules: SourceModule[] = [];
		for (const path of globSync("**/*.ts", { cwd: this.srcDir })) {
			if (!path.endsWith(".test.ts")) {
				modules.push(this.read(path));
			}
		}
		return modules;
	}

	private read(path: string): SourceModule {
		const folders = new Set<string>();
		const packages = new Set<string>();
		for (const [, specifier] of readFileSync(join(this.srcDir, path), "utf8").matchAll(/from "([^"]+)"/g)) {
			if (specifier === undefined) {
				continue;
			}
			if (specifier.startsWith(".")) {
				folders.add(this.folderOf(normalize(join(dirname(path), specifier))));
			} else {
				packages.add(specifier);
			}
		}
		const folder = this.folderOf(path);
		folders.delete(folder);
		return { folder, folders: [...folders].sort(), packages: [...packages].sort(), path };
	}

	private folderOf(path: string): string {
		const segments = relative(".", path).split(sep);
		return segments.length > 1 ? (segments[0] ?? ".") : ".";
	}
}
