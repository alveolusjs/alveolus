import { Project, SyntaxKind } from "ts-morph";
import type { ExportDeclaration, ImportDeclaration, SourceFile } from "ts-morph";

import { isAbsolute, join, relative } from "node:path";

import type { ImportTarget } from "../codebase/index.ts";
import { Codebase, CodeFile, Declaration, Import, Layout } from "../codebase/index.ts";
import type { Config } from "../config/index.ts";
import { ClassReader } from "./class-reader.ts";
import { CodeAnalyzer } from "./code-analyzer.ts";
import { PackageNames } from "./package-names.ts";
import { TypeInspector } from "./type-inspector.ts";

type ModuleDeclaration = ImportDeclaration | ExportDeclaration;

export class TsMorphAnalyzer extends CodeAnalyzer {
	private readonly types: TypeInspector;
	private readonly classes: ClassReader;

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
		const files = this.project
			.getSourceFiles()
			.filter((file) => this.isInside(config.rootDir, file.getFilePath()) && !config.isIgnored(file.getFilePath()))
			.map((file) => this.read(file, config, layout));
		return new Codebase(files, config);
	}

	private read(file: SourceFile, config: Config, layout: Layout): CodeFile {
		const path = file.getFilePath();
		const imports = this.moduleDeclarationsOf(file).map((declaration) => this.readImport(declaration, config, layout));
		const classes = file.getClasses().map((declaration) => this.classes.read(declaration));
		return new CodeFile({
			classes,
			declarations: this.declarationsOf(file),
			domainErrorThrows: this.domainErrorThrowsOf(file),
			imports,
			location: layout.locate(path),
			path,
		});
	}

	private declarationsOf(file: SourceFile): Declaration[] {
		const functions = file.getFunctions().map((declaration) => new Declaration("function", declaration.getName() ?? "default", declaration.getStartLineNumber()));
		const functionConstants = file
			.getVariableDeclarations()
			.filter((declaration) => declaration.getInitializerIfKind(SyntaxKind.ArrowFunction) !== undefined || declaration.getInitializerIfKind(SyntaxKind.FunctionExpression) !== undefined)
			.map((declaration) => new Declaration("function", declaration.getName(), declaration.getStartLineNumber()));
		const enums = file.getEnums().map((declaration) => new Declaration("enum", declaration.getName(), declaration.getStartLineNumber()));
		return [...functions, ...functionConstants, ...enums];
	}

	private moduleDeclarationsOf(file: SourceFile): ModuleDeclaration[] {
		const reexports = file.getExportDeclarations().filter((declaration) => declaration.hasModuleSpecifier());
		return [...file.getImportDeclarations(), ...reexports];
	}

	private readImport(declaration: ModuleDeclaration, config: Config, layout: Layout): Import {
		const specifier = declaration.getModuleSpecifierValue() ?? "";
		return new Import(declaration.getStartLineNumber(), specifier, this.importedNames(declaration), this.targetOf(declaration, specifier, config, layout));
	}

	private importedNames(declaration: ModuleDeclaration): string[] {
		if (declaration.isKind(SyntaxKind.ExportDeclaration)) {
			return declaration.isNamespaceExport() ? ["*"] : declaration.getNamedExports().map((named) => named.getName());
		}
		const names = declaration.getNamedImports().map((named) => named.getName());
		if (declaration.getDefaultImport() !== undefined) {
			names.unshift("default");
		}
		if (declaration.getNamespaceImport() !== undefined) {
			names.unshift("*");
		}
		return names;
	}

	private targetOf(declaration: ModuleDeclaration, specifier: string, config: Config, layout: Layout): ImportTarget {
		const resolved = declaration.getModuleSpecifierSourceFile()?.getFilePath();
		if (resolved !== undefined && this.isInside(config.projectDir, resolved)) {
			return { kind: "file", location: layout.locate(resolved), path: resolved };
		}
		if (specifier.startsWith(".")) {
			const path = join(declaration.getSourceFile().getDirectoryPath(), specifier);
			return { kind: "file", location: layout.locate(path), path };
		}
		return { kind: "package", name: this.packageNameOf(specifier) };
	}

	private packageNameOf(specifier: string): string {
		const segments = specifier.split("/");
		const length = specifier.startsWith("@") ? 2 : 1;
		return segments.slice(0, length).join("/");
	}

	private domainErrorThrowsOf(file: SourceFile): number[] {
		return file
			.getDescendantsOfKind(SyntaxKind.ThrowStatement)
			.filter((statement) => this.types.kindsOf(statement.getExpression().getType()).includes("DomainError"))
			.map((statement) => statement.getStartLineNumber());
	}

	private isInside(directory: string, path: string): boolean {
		const offset = relative(directory, path);
		return offset !== "" && !offset.startsWith("..") && !isAbsolute(offset) && !offset.split(/[\\/]/).includes("node_modules");
	}
}
