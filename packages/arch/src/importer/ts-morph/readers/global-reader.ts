import { ModuleDeclarationKind, Node, SyntaxKind, ts } from "ts-morph";
import type { Identifier, SourceFile } from "ts-morph";

import { basename, isAbsolute, relative } from "node:path";

import type { GlobalEffect } from "../../../model/index.ts";
import type { GlobalReference } from "./global-reference.ts";

interface Effect {
	readonly name: string;
	readonly effect: GlobalEffect;
}

const ecmaScriptLibrary = /^lib\.(es|decorators).*\.d\.ts$/;

export class GlobalReader {
	public constructor(private readonly projectDir: string) {}

	public read(file: SourceFile): GlobalReference[] {
		const references: GlobalReference[] = [];
		for (const identifier of file.getDescendantsOfKind(SyntaxKind.Identifier)) {
			const declaringFile = this.globalDeclaringFileOf(identifier);
			if (declaringFile === undefined || declaringFile === file) {
				continue;
			}
			const origin = this.originOf(declaringFile.getFilePath());
			const effect = origin === "ecmascript" ? this.effectOf(identifier) : undefined;
			references.push({
				declaredIn: declaringFile.getFilePath(),
				effect: effect?.effect,
				line: identifier.getStartLineNumber(),
				name: effect?.name ?? identifier.getText(),
				origin,
			});
		}
		return references;
	}

	private globalDeclaringFileOf(identifier: Identifier): SourceFile | undefined {
		const symbol = identifier.getSymbol();
		const declaration = symbol?.getValueDeclaration() ?? symbol?.getDeclarations()[0];
		if (declaration === undefined || !this.isGlobalScope(declaration)) {
			return undefined;
		}
		return declaration.getSourceFile();
	}

	private isGlobalScope(declaration: Node): boolean {
		const statement = Node.isVariableDeclaration(declaration) ? declaration.getVariableStatement() : declaration;
		const container = statement?.getParent();
		if (Node.isSourceFile(container)) {
			return !ts.isExternalModule(container.compilerNode);
		}
		const module = container?.getParent();
		return Node.isModuleBlock(container) && Node.isModuleDeclaration(module) && module.getDeclarationKind() === ModuleDeclarationKind.Global;
	}

	private originOf(path: string): GlobalReference["origin"] {
		if (this.isInsideProject(path)) {
			return "project";
		}
		return ecmaScriptLibrary.test(basename(path)) ? "ecmascript" : "host";
	}

	private effectOf(identifier: Identifier): Effect | undefined {
		const name = identifier.getText();
		const parent = identifier.getParent();
		if (name === "Date") {
			if (Node.isNewExpression(parent) && parent.getExpression() === identifier && parent.getArguments().length === 0) {
				return { effect: "clock", name: "new Date()" };
			}
			if (Node.isCallExpression(parent) && parent.getExpression() === identifier) {
				return { effect: "clock", name: "Date()" };
			}
			if (this.isMemberAccess(parent, identifier, "now")) {
				return { effect: "clock", name: "Date.now" };
			}
		}
		if (name === "Math" && this.isMemberAccess(parent, identifier, "random")) {
			return { effect: "randomness", name: "Math.random" };
		}
		return undefined;
	}

	private isMemberAccess(parent: Node | undefined, object: Identifier, member: string): boolean {
		return Node.isPropertyAccessExpression(parent) && parent.getExpression() === object && parent.getName() === member;
	}

	private isInsideProject(path: string): boolean {
		const offset = relative(this.projectDir, path);
		return offset !== "" && !offset.startsWith("..") && !isAbsolute(offset) && !offset.split(/[\\/]/).includes("node_modules");
	}
}
