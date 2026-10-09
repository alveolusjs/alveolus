import { SyntaxKind, ts } from "ts-morph";
import type { CallExpression, ExportDeclaration, FileReference, ImportDeclaration, ImportEqualsDeclaration, ImportTypeNode, ModuleDeclaration, Node, Project, SourceFile } from "ts-morph";

import { isAbsolute, join, normalize, relative } from "node:path";

import type { DependencyForm, DependencyTarget } from "../../../model/index.ts";
import { Dependency } from "../../../model/index.ts";
import type { ImportScope } from "../../importer.ts";
import type { GlobalReference } from "./global-reference.ts";
import { LoaderReader } from "./loader-reader.ts";

interface ModuleReference {
	readonly line: number;
	readonly form: DependencyForm;
	readonly specifier: string | undefined;
	readonly text: string;
	readonly names: readonly string[];
	readonly isPath?: boolean;
}

const everything: readonly string[] = ["*"];

const loaderPackages: readonly string[] = ["module", "node:module", "vm", "node:vm"];

export class DependencyReader {
	private readonly loaders = new LoaderReader();

	public constructor(
		private readonly project: Project,
		private readonly scope: ImportScope,
	) {}

	public read(file: SourceFile, globals: readonly GlobalReference[]): Dependency[] {
		const dependencies: Dependency[] = [];
		for (const reference of this.referencesOf(file)) {
			dependencies.push(new Dependency(reference.line, reference.form, reference.specifier ?? reference.text, reference.names, this.targetOf(reference, file)));
		}
		for (const global of globals) {
			if (global.origin === "project") {
				dependencies.push(new Dependency(global.line, "global", global.declaredIn, [global.name], this.fileTarget(normalize(global.declaredIn))));
			}
		}
		return dependencies.sort((left, right) => left.line - right.line);
	}

	private referencesOf(file: SourceFile): ModuleReference[] {
		const references: ModuleReference[] = [];
		for (const declaration of file.getImportDeclarations()) {
			references.push(this.fromDeclaration(declaration, "import"));
		}
		for (const declaration of file.getExportDeclarations()) {
			if (declaration.hasModuleSpecifier()) {
				references.push(this.fromDeclaration(declaration, "re-export"));
			}
		}
		for (const declaration of file.getDescendantsOfKind(SyntaxKind.ImportEqualsDeclaration)) {
			references.push(...this.fromImportEquals(declaration));
		}
		for (const node of file.getDescendantsOfKind(SyntaxKind.ImportType)) {
			references.push(this.fromImportType(node));
		}
		for (const call of file.getDescendantsOfKind(SyntaxKind.CallExpression)) {
			references.push(...this.fromCall(call));
		}
		for (const load of this.loaders.read(file)) {
			references.push({ form: "dynamic load", line: load.line, names: [], specifier: load.loader, text: load.loader });
		}
		for (const reference of file.getPathReferenceDirectives()) {
			references.push({ ...this.fromDirective(reference, file), isPath: true });
		}
		for (const reference of file.getTypeReferenceDirectives()) {
			references.push(this.fromDirective(reference, file));
		}
		for (const declaration of file.getDescendantsOfKind(SyntaxKind.ModuleDeclaration)) {
			references.push(...this.fromAugmentation(declaration));
		}
		return references;
	}

	private fromDeclaration(declaration: ImportDeclaration | ExportDeclaration, form: DependencyForm): ModuleReference {
		const specifier = declaration.getModuleSpecifierValue() ?? "";
		return { form, line: declaration.getStartLineNumber(), names: this.declaredNames(declaration), specifier, text: specifier };
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
		return [this.reference(declaration, "require", reference.getExpressionOrThrow(), everything)];
	}

	private fromImportType(node: ImportTypeNode): ModuleReference {
		const argument = node.getArgument();
		const literal = argument.isKind(SyntaxKind.LiteralType) ? argument.getLiteral() : argument;
		const qualifier = node.getQualifier();
		const names = qualifier === undefined ? everything : [qualifier.getText().split(".")[0] ?? "*"];
		return this.reference(node, "inline type", literal, names);
	}

	private fromCall(call: CallExpression): ModuleReference[] {
		const callee = call.getExpression();
		const [argument] = call.getArguments();
		if (argument === undefined) {
			return [];
		}
		if (callee.isKind(SyntaxKind.ImportKeyword)) {
			return [this.reference(call, "dynamic import", argument, everything)];
		}
		if (callee.isKind(SyntaxKind.Identifier) && callee.getText() === "require") {
			return [this.reference(call, "require", argument, everything)];
		}
		return [];
	}

	private fromDirective(reference: FileReference, file: SourceFile): ModuleReference {
		const line = file.getLineAndColumnAtPos(reference.getPos()).line;
		const specifier = reference.getFileName();
		return { form: "reference", line, names: everything, specifier, text: specifier };
	}

	private fromAugmentation(declaration: ModuleDeclaration): ModuleReference[] {
		const name = declaration.getNameNode();
		if (!name.isKind(SyntaxKind.StringLiteral) || name.getLiteralValue().includes("*")) {
			return [];
		}
		return [this.reference(declaration, "augmentation", name, everything)];
	}

	private reference(node: Node, form: DependencyForm, specifierNode: Node, names: readonly string[]): ModuleReference {
		const isLiteral = specifierNode.isKind(SyntaxKind.StringLiteral) || specifierNode.isKind(SyntaxKind.NoSubstitutionTemplateLiteral);
		return { form, line: node.getStartLineNumber(), names, specifier: isLiteral ? specifierNode.getLiteralValue() : undefined, text: specifierNode.getText() };
	}

	private targetOf(reference: ModuleReference, file: SourceFile): DependencyTarget {
		if (reference.form === "dynamic load" || loaderPackages.includes(reference.specifier ?? "")) {
			return { kind: "file", path: reference.text, visibility: "dynamic" };
		}
		const directory = file.getDirectoryPath();
		if (reference.specifier === undefined) {
			return { kind: "file", path: normalize(join(directory, reference.text)), visibility: "unresolved" };
		}
		const resolved = reference.isPath === true ? this.referencedPath(reference.specifier, directory) : this.resolve(reference.specifier, file);
		if (resolved !== undefined && this.isInsideProject(resolved)) {
			return this.fileTarget(resolved);
		}
		if (reference.isPath === true || reference.specifier.startsWith(".")) {
			return { kind: "file", path: normalize(join(directory, reference.specifier)), visibility: "unresolved" };
		}
		return { kind: "package", name: this.packageNameOf(reference.specifier) };
	}

	private fileTarget(path: string): DependencyTarget {
		return { kind: "file", path, visibility: this.scope.isIgnored(path) ? "ignored" : "analysed" };
	}

	private resolve(specifier: string, file: SourceFile): string | undefined {
		const resolution = ts.resolveModuleName(specifier, file.getFilePath(), this.project.getCompilerOptions(), this.project.getModuleResolutionHost());
		const resolved = resolution.resolvedModule?.resolvedFileName;
		return resolved === undefined ? undefined : normalize(resolved);
	}

	private referencedPath(specifier: string, directory: string): string | undefined {
		const path = normalize(join(directory, specifier));
		return this.project.getModuleResolutionHost().fileExists(path) ? path : undefined;
	}

	private packageNameOf(specifier: string): string {
		const segments = specifier.split("/");
		const length = specifier.startsWith("@") ? 2 : 1;
		return segments.slice(0, length).join("/");
	}

	private isInsideProject(path: string): boolean {
		const offset = relative(this.scope.projectDir, path);
		return offset !== "" && !offset.startsWith("..") && !isAbsolute(offset) && !offset.split(/[\\/]/).includes("node_modules");
	}
}
