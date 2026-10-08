import { Project as MorphProject } from "ts-morph";
import type { SourceFile as MorphFile } from "ts-morph";

import { isAbsolute, join, relative } from "node:path";

import { GlobalUse, Project, SourceFile } from "../../model/index.ts";
import type { ImportScope } from "../importer.ts";
import { Importer } from "../importer.ts";
import { PackageNames } from "./package-names.ts";
import { ClassReader } from "./readers/class-reader.ts";
import { DependencyReader } from "./readers/dependency-reader.ts";
import { GlobalReader } from "./readers/global-reader.ts";
import type { GlobalReference } from "./readers/global-reference.ts";
import { StatementReader } from "./readers/statement-reader.ts";
import { ThrowReader } from "./readers/throw-reader.ts";
import { TypeReader } from "./readers/type-reader.ts";

/** Reads a TypeScript project with ts-morph: each reader turns one family of syntax into facts of the model. */
export class TsMorphImporter extends Importer {
	private readonly classes: ClassReader;
	private readonly statements = new StatementReader();
	private readonly throws = new ThrowReader();

	public constructor(private readonly sources: MorphProject) {
		super();
		this.classes = new ClassReader(new TypeReader(new PackageNames(sources.getFileSystem())));
	}

	public static fromTsConfig(projectDir: string): TsMorphImporter {
		return new TsMorphImporter(new MorphProject({ tsConfigFilePath: join(projectDir, "tsconfig.json") }));
	}

	public read(scope: ImportScope): Project {
		const dependencies = new DependencyReader(this.sources, scope);
		const globals = new GlobalReader(scope.projectDir);
		const files: SourceFile[] = [];
		for (const file of this.sources.getSourceFiles()) {
			if (this.isInside(scope.rootDir, file.getFilePath()) && !scope.isIgnored(file.getFilePath())) {
				files.push(this.readFile(file, dependencies, globals));
			}
		}
		return new Project(scope.projectDir, files);
	}

	private readFile(file: MorphFile, dependencies: DependencyReader, globals: GlobalReader): SourceFile {
		const globalReferences = globals.read(file);
		return new SourceFile({
			classes: file.getClasses().map((declaration) => this.classes.read(declaration)),
			dependencies: dependencies.read(file, globalReferences),
			globals: this.globalUsesOf(globalReferences),
			path: file.getFilePath(),
			statements: this.statements.read(file),
			text: file.getFullText(),
			throws: this.throws.read(file),
		});
	}

	/** Globals declared outside the project; those of the project become dependencies on the declaring file. */
	private globalUsesOf(references: readonly GlobalReference[]): GlobalUse[] {
		const uses: GlobalUse[] = [];
		for (const reference of references) {
			if (reference.origin !== "project") {
				uses.push(new GlobalUse(reference.line, reference.name, reference.origin, reference.effect));
			}
		}
		return uses;
	}

	private isInside(directory: string, path: string): boolean {
		const offset = relative(directory, path);
		return offset !== "" && !offset.startsWith("..") && !isAbsolute(offset) && !offset.split(/[\\/]/).includes("node_modules");
	}
}
