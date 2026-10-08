import { SyntaxKind, ts } from "ts-morph";
import type { CallExpression, ExportDeclaration, ImportDeclaration, ImportEqualsDeclaration, ImportTypeNode, Node, Project, SourceFile } from "ts-morph";

import { isAbsolute, join, relative } from "node:path";

import type { ImportTarget, Layout } from "../codebase/index.ts";
import { Import } from "../codebase/index.ts";
import type { Config } from "../config/index.ts";
import type { GlobalReference } from "./global-reference.ts";

/** A module a file depends on, as written: `specifier` is undefined when it is computed at runtime. */
interface ModuleReference {
	readonly line: number;
	readonly specifier: string | undefined;
	readonly text: string;
	readonly names: readonly string[];
	readonly isReexport: boolean;
}

const everything: readonly string[] = ["*"];

/**
 * Reads every module a file depends on: import and export declarations, `import("…")` types, dynamic `import()`, `require()`,
 * `import … = require()`, and the files of the project that declare the globals it uses.
 */
export class DependencyReader {
	public constructor(
		private readonly project: Project,
		private readonly config: Config,
		private readonly layout: Layout,
	) {}

	public read(file: SourceFile, globals: readonly GlobalReference[]): Import[] {
		const modules = this.referencesOf(file).map(
			(reference) => new Import(reference.line, reference.specifier ?? reference.text, reference.names, this.targetOf(reference, file), reference.isReexport),
		);
		const declaringFiles = globals.filter((global) => global.origin === "project").map((global) => new Import(global.line, global.declaredIn, [global.name], this.fileTarget(global.declaredIn)));
		return [...modules, ...declaringFiles].sort((left, right) => left.line - right.line);
	}

	private referencesOf(file: SourceFile): ModuleReference[] {
		const declarations = [...file.getImportDeclarations(), ...file.getExportDeclarations().filter((declaration) => declaration.hasModuleSpecifier())];
		return [
			...declarations.map((declaration) => this.fromDeclaration(declaration)),
			...file.getDescendantsOfKind(SyntaxKind.ImportEqualsDeclaration).flatMap((declaration) => this.fromImportEquals(declaration)),
			...file.getDescendantsOfKind(SyntaxKind.ImportType).flatMap((node) => this.fromImportType(node)),
			...file.getDescendantsOfKind(SyntaxKind.CallExpression).flatMap((call) => this.fromCall(call)),
		];
	}

	private fromDeclaration(declaration: ImportDeclaration | ExportDeclaration): ModuleReference {
		const specifier = declaration.getModuleSpecifierValue() ?? "";
		const isReexport = declaration.isKind(SyntaxKind.ExportDeclaration);
		return { isReexport, line: declaration.getStartLineNumber(), names: this.declaredNames(declaration), specifier, text: specifier };
	}

	private declaredNames(declaration: ImportDeclaration | ExportDeclaration): string[] {
		if (declaration.isKind(SyntaxKind.ExportDeclaration)) {
			return declaration.isNamespaceExport() ? [...everything] : declaration.getNamedExports().map((named) => named.getName());
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

	private fromImportEquals(declaration: ImportEqualsDeclaration): ModuleReference[] {
		const reference = declaration.getModuleReference();
		if (!reference.isKind(SyntaxKind.ExternalModuleReference)) {
			return [];
		}
		const expression = reference.getExpressionOrThrow();
		return [this.reference(declaration, expression, everything)];
	}

	private fromImportType(node: ImportTypeNode): ModuleReference[] {
		const argument = node.getArgument();
		const literal = argument.isKind(SyntaxKind.LiteralType) ? argument.getLiteral() : argument;
		const qualifier = node.getQualifier();
		const names = qualifier === undefined ? everything : [qualifier.getText().split(".")[0] ?? "*"];
		return [this.reference(node, literal, names)];
	}

	private fromCall(call: CallExpression): ModuleReference[] {
		const callee = call.getExpression();
		const isDynamicImport = callee.isKind(SyntaxKind.ImportKeyword);
		const isRequire = callee.isKind(SyntaxKind.Identifier) && callee.getText() === "require";
		const [argument] = call.getArguments();
		if ((!isDynamicImport && !isRequire) || argument === undefined) {
			return [];
		}
		return [this.reference(call, argument, everything)];
	}

	private reference(node: Node, specifierNode: Node, names: readonly string[]): ModuleReference {
		const isLiteral = specifierNode.isKind(SyntaxKind.StringLiteral) || specifierNode.isKind(SyntaxKind.NoSubstitutionTemplateLiteral);
		return { isReexport: false, line: node.getStartLineNumber(), names, specifier: isLiteral ? specifierNode.getLiteralValue() : undefined, text: specifierNode.getText() };
	}

	private targetOf(reference: ModuleReference, file: SourceFile): ImportTarget {
		const directory = file.getDirectoryPath();
		if (reference.specifier === undefined) {
			const path = join(directory, reference.text);
			return { kind: "file", location: this.layout.unseen(path, "unresolved"), path };
		}
		const resolved = this.resolve(reference.specifier, file);
		if (resolved !== undefined && this.isInside(this.config.projectDir, resolved)) {
			return this.fileTarget(resolved);
		}
		if (reference.specifier.startsWith(".")) {
			const path = join(directory, reference.specifier);
			return { kind: "file", location: this.layout.unseen(path, "unresolved"), path };
		}
		return { kind: "package", name: this.packageNameOf(reference.specifier) };
	}

	private fileTarget(path: string): ImportTarget {
		const location = this.config.isIgnored(path) ? this.layout.unseen(path, "ignored") : this.layout.locate(path);
		return { kind: "file", location, path };
	}

	private resolve(specifier: string, file: SourceFile): string | undefined {
		const resolution = ts.resolveModuleName(specifier, file.getFilePath(), this.project.getCompilerOptions(), this.project.getModuleResolutionHost());
		return resolution.resolvedModule?.resolvedFileName;
	}

	private packageNameOf(specifier: string): string {
		const segments = specifier.split("/");
		const length = specifier.startsWith("@") ? 2 : 1;
		return segments.slice(0, length).join("/");
	}

	private isInside(directory: string, path: string): boolean {
		const offset = relative(directory, path);
		return offset !== "" && !offset.startsWith("..") && !isAbsolute(offset) && !offset.split(/[\\/]/).includes("node_modules");
	}
}
