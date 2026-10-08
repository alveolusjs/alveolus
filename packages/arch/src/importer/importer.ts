import type { Project } from "../model/index.ts";

export interface ImportScope {
	readonly projectDir: string;
	readonly rootDir: string;
	isIgnored(path: string): boolean;
}

export abstract class Importer {
	public abstract read(scope: ImportScope): Project;

	public abstract resolves(packageName: string, scope: ImportScope): boolean;
}
