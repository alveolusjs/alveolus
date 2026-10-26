import { ModuleResolver } from './module-resolver.ts';
import { ProjectRoot } from './project-root.ts';
import type { SourceFile } from './source-file.ts';
import { SourceFileParser } from './source-file-parser.ts';

export class Codebase {
	private constructor(public readonly files: readonly SourceFile[]) {}

	public static read(directory: string): Codebase {
		const root = new ProjectRoot(directory);
		const parser = new SourceFileParser(root, new ModuleResolver(root));
		const files: SourceFile[] = [];

		for (const path of root.files('src/**/*.ts', ['**/__test__/**', '**/*.d.ts'])) {
			files.push(parser.parse(path));
		}

		return new Codebase(files);
	}
}
