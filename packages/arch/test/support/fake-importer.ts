import type { ImportScope } from "../../src/importer/index.ts";
import { Importer } from "../../src/importer/index.ts";
import { Project, SourceFile } from "../../src/model/index.ts";

export class FakeImporter extends Importer {
	public constructor(private readonly resolvable: boolean) {
		super();
	}

	public read(scope: ImportScope): Project {
		const file = new SourceFile({ classes: [], dependencies: [], disables: [], globals: [], moduleReaches: [], path: `${scope.rootDir}/index.ts`, statements: [], text: "", throws: [], wirings: [] });
		return new Project(scope.projectDir, [file]);
	}

	public resolves(): boolean {
		return this.resolvable;
	}
}
