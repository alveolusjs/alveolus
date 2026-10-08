import { relative, sep } from "node:path";

import type { ClassDeclaration } from "./classes/class-declaration.ts";
import type { ClassType } from "./classes/class-type.ts";
import type { SourceFile } from "./source-file.ts";

export class Project {
	private readonly filesByPath: ReadonlyMap<string, SourceFile>;

	public constructor(
		public readonly directory: string,
		public readonly files: readonly SourceFile[],
	) {
		this.filesByPath = new Map(files.map((file) => [file.path, file]));
	}

	public file(path: string): SourceFile | undefined {
		return this.filesByPath.get(path);
	}

	public classOf(type: ClassType): ClassDeclaration | undefined {
		if (type.declaredIn === undefined) {
			return undefined;
		}
		return this.file(type.declaredIn)?.classNamed(type.name);
	}

	public relativePath(path: string): string {
		return relative(this.directory, path).split(sep).join("/");
	}
}
