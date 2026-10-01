import { relative, sep } from "node:path";

import type { Config } from "../config/index.ts";
import type { CodeFile } from "./code-file.ts";

export class Codebase {
	private readonly filesByPath: ReadonlyMap<string, CodeFile>;

	public constructor(
		public readonly files: readonly CodeFile[],
		public readonly config: Config,
	) {
		this.filesByPath = new Map(files.map((file) => [file.path, file]));
	}

	public file(path: string): CodeFile | undefined {
		return this.filesByPath.get(path);
	}

	public relativePath(path: string): string {
		return relative(this.config.projectDir, path).split(sep).join("/");
	}
}
