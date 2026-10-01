import { Project } from "ts-morph";
import type { Node, SourceFile } from "ts-morph";

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

export interface Violation {
	readonly rule: string;
	readonly message: string;
	readonly file: string;
	readonly line: number;
	readonly column: number;
}

export interface CheckContext {
	readonly srcDir: string;
	readonly sourceFiles: readonly SourceFile[];
}

export function createContext(tsconfig: string): CheckContext {
	const project = new Project({ tsConfigFilePath: tsconfig });
	const srcDir = join(dirname(tsconfig), "src");
	const sourceFiles = project
		.getSourceFiles()
		.filter((file) => !file.isDeclarationFile() && isInside(srcDir, file.getFilePath()));
	return { sourceFiles, srcDir };
}

export function violation(node: Node, rule: string, message: string): Violation {
	const sourceFile = node.getSourceFile();
	const { line, column } = sourceFile.getLineAndColumnAtPos(node.getStart());
	return { column, file: sourceFile.getFilePath(), line, message, rule };
}

export function pathSegments(from: string, filePath: string): string[] {
	return relative(from, filePath).split(sep);
}

function isInside(directory: string, filePath: string): boolean {
	const segments = pathSegments(directory, filePath);
	return segments[0] !== ".." && segments[0] !== "";
}

const packageNames = new Map<string, string | undefined>();

export function packageNameOf(filePath: string): string | undefined {
	const directory = dirname(filePath);
	if (packageNames.has(directory)) {
		return packageNames.get(directory);
	}
	const manifest = join(directory, "package.json");
	let name: string | undefined;
	if (existsSync(manifest)) {
		const parsed: unknown = JSON.parse(readFileSync(manifest, "utf8"));
		name =
			typeof parsed === "object" && parsed !== null && "name" in parsed && typeof parsed.name === "string"
				? parsed.name
				: undefined;
	} else if (dirname(directory) !== directory) {
		name = packageNameOf(directory);
	}
	packageNames.set(directory, name);
	return name;
}
