import type { Project } from "../model/index.ts";

/** Which files the importer reads, and which it leaves out. */
export interface ImportScope {
	readonly projectDir: string;
	/** The folder whose files are analysed, `src/` usually. */
	readonly rootDir: string;
	isIgnored(path: string): boolean;
}

/** Reads the sources of a project into the model. */
export abstract class Importer {
	public abstract read(scope: ImportScope): Project;
}
