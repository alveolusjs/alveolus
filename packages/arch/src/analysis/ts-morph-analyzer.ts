import { Project, SyntaxKind } from "ts-morph";
import type { SourceFile } from "ts-morph";

import { isAbsolute, join, relative } from "node:path";

import { Codebase, CodeFile, GlobalUse, Layout, Throw } from "../codebase/index.ts";
import type { Config } from "../config/index.ts";
import { ClassReader } from "./class-reader.ts";
import { CodeAnalyzer } from "./code-analyzer.ts";
import { DependencyReader } from "./dependency-reader.ts";
import { GlobalReader } from "./global-reader.ts";
import type { GlobalReference } from "./global-reference.ts";
import { PackageNames } from "./package-names.ts";
import { TopLevelReader } from "./top-level-reader.ts";
import { TypeInspector } from "./type-inspector.ts";

export class TsMorphAnalyzer extends CodeAnalyzer {
	private readonly types: TypeInspector;
	private readonly classes: ClassReader;
	private readonly topLevel = new TopLevelReader();

	public constructor(private readonly project: Project) {
		super();
		this.types = new TypeInspector(new PackageNames(project.getFileSystem()));
		this.classes = new ClassReader(this.types);
	}

	public static fromTsConfig(projectDir: string): TsMorphAnalyzer {
		return new TsMorphAnalyzer(new Project({ tsConfigFilePath: join(projectDir, "tsconfig.json") }));
	}

	public analyze(config: Config): Codebase {
		const layout = new Layout(config);
		const dependencies = new DependencyReader(this.project, config, layout);
		const globals = new GlobalReader(config.projectDir);
		const files = this.project
			.getSourceFiles()
			.filter((file) => this.isInside(config.rootDir, file.getFilePath()) && !config.isIgnored(file.getFilePath()))
			.map((file) => this.read(file, layout, dependencies, globals));
		return new Codebase(files, config);
	}

	private read(file: SourceFile, layout: Layout, dependencies: DependencyReader, globals: GlobalReader): CodeFile {
		const path = file.getFilePath();
		const globalReferences = globals.read(file);
		const classes = file.getClasses().map((declaration) => this.classes.read(declaration));
		return new CodeFile({
			classes,
			declarations: this.topLevel.read(file),
			globals: this.globalUsesOf(globalReferences),
			imports: dependencies.read(file, globalReferences),
			lines: file.getFullText().split(/\r?\n/),
			location: layout.locate(path),
			path,
			throws: this.throwsOf(file),
		});
	}

	private globalUsesOf(references: readonly GlobalReference[]): GlobalUse[] {
		const uses: GlobalUse[] = [];
		for (const reference of references) {
			if (reference.origin !== "project") {
				uses.push(new GlobalUse(reference.line, reference.name, reference.origin, reference.effect));
			}
		}
		return uses;
	}

	private throwsOf(file: SourceFile): Throw[] {
		const statements = file.getDescendantsOfKind(SyntaxKind.ThrowStatement).map((statement) => new Throw(statement.getStartLineNumber(), "throw"));
		const rejections = file
			.getDescendantsOfKind(SyntaxKind.CallExpression)
			.filter((call) => call.getExpression().getText() === "Promise.reject")
			.map((call) => new Throw(call.getStartLineNumber(), "Promise.reject"));
		return [...statements, ...rejections].sort((left, right) => left.line - right.line);
	}

	private isInside(directory: string, path: string): boolean {
		const offset = relative(directory, path);
		return offset !== "" && !offset.startsWith("..") && !isAbsolute(offset) && !offset.split(/[\\/]/).includes("node_modules");
	}
}
