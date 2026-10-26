import type { Codebase } from '../codebase/codebase.ts';
import type { SourceFile } from '../codebase/source-file.ts';
import type { Architecture } from '../layout/architecture.ts';
import type { Placement } from '../layout/placement.ts';
import type { ImplementationStyle } from '../layout/style.ts';

export class Project {
	private constructor(
		public readonly files: readonly SourceFile[],
		private readonly architecture: Architecture,
	) {}

	public static seenBy(
		styles: readonly ImplementationStyle[],
		codebase: Codebase,
		architecture: Architecture,
	): Project {
		const files: SourceFile[] = [];

		for (const file of codebase.files) {
			if (architecture.checks(file.path, styles)) {
				files.push(file);
			}
		}

		return new Project(files, architecture);
	}

	public placementOf(path: string): Placement | undefined {
		return this.architecture.placementOf(path);
	}
}
