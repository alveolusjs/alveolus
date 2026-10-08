import type { ImportScope } from "../../src/importer/index.ts";
import { Importer } from "../../src/importer/index.ts";
import { Project } from "../../src/model/index.ts";

/** An importer that reads nothing, and resolves packages or not, as the test decides. */
export class FakeImporter extends Importer {
	public constructor(private readonly resolvable: boolean) {
		super();
	}

	public read(scope: ImportScope): Project {
		return new Project(scope.projectDir, []);
	}

	public resolves(): boolean {
		return this.resolvable;
	}
}
