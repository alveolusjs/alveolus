import { ExternalModules } from './external-modules.ts';
import { ModuleResolver } from './module-resolver.ts';
import type { ProjectRoot } from './project-root.ts';
import type { SourceFile } from './source-file.ts';
import { SourceFileParser } from './source-file-parser.ts';

const leftOut = ['**/__test__/**', '**/*.d.ts'];

export class Codebase {
	private constructor(public readonly files: readonly SourceFile[]) {}

	public static read(root: ProjectRoot, folders: readonly string[]): Codebase {
		const parser = new SourceFileParser(root, new ModuleResolver(root));
		const external = ExternalModules.of(root);
		const files: SourceFile[] = [];
		const unresolved: string[] = [];

		for (const path of root.files(folders, '.ts', leftOut)) {
			const file = parser.parse(path);
			files.push(file);

			for (const dependency of file.dependencies) {
				if (dependency.target === undefined && !external.includes(dependency.specifier)) {
					unresolved.push(`${file.path}:${dependency.line} imports '${dependency.specifier}'`);
				}
			}
		}

		if (unresolved.length > 0) {
			throw new Error(`These imports do not resolve, so no rule can follow them:\n${unresolved.join('\n')}`);
		}

		return new Codebase(files);
	}
}
