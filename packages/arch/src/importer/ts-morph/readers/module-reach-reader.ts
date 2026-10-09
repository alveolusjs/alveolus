import { Node, SyntaxKind } from "ts-morph";
import type { SourceFile } from "ts-morph";

import { ModuleReach } from "../../../model/index.ts";
import type { ImportScope } from "../../importer.ts";
import type { TypeReader } from "./type-reader.ts";

const candidates: readonly SyntaxKind[] = [SyntaxKind.Identifier, SyntaxKind.PropertyAccessExpression, SyntaxKind.ElementAccessExpression, SyntaxKind.CallExpression, SyntaxKind.NewExpression];

export class ModuleReachReader {
	public constructor(
		private readonly types: TypeReader,
		private readonly scope: ImportScope,
	) {}

	public read(file: SourceFile): ModuleReach[] {
		if (!this.scope.readsWiring(file.getFilePath())) {
			return [];
		}
		const reaches: ModuleReach[] = [];
		file.forEachDescendant((node) => {
			const reach = this.reachAt(node, file);
			if (reach !== undefined) {
				reaches.push(reach);
			}
		});
		return reaches;
	}

	private reachAt(node: Node, file: SourceFile): ModuleReach | undefined {
		if (!candidates.includes(node.getKind()) || this.isName(node)) {
			return undefined;
		}
		const type = node.getType();
		if (!type.isClass()) {
			return undefined;
		}
		const module = this.types.classTypeOf(type);
		if (module.declaredIn === undefined || module.declaredIn === file.getFilePath() || !this.scope.readsWiring(module.declaredIn)) {
			return undefined;
		}
		const means = this.meansOf(node);
		return means === undefined ? undefined : new ModuleReach(node.getStartLineNumber(), node.getText(), means, module);
	}

	private meansOf(node: Node): string | undefined {
		const { child, parent } = this.usageOf(node);
		if (parent === undefined) {
			return undefined;
		}
		if (Node.isElementAccessExpression(parent) && parent.getExpression() === child) {
			return "brackets";
		}
		if (Node.isSpreadAssignment(parent) || Node.isSpreadElement(parent)) {
			return "a spread";
		}
		if (Node.isVariableDeclaration(parent) && !Node.isIdentifier(parent.getNameNode())) {
			return "destructuring";
		}
		if ((Node.isCallExpression(parent) || Node.isNewExpression(parent)) && parent.getArguments().includes(child)) {
			return this.isModuleConstruction(parent) ? undefined : parent.getExpression().getText();
		}
		return undefined;
	}

	private usageOf(node: Node): { readonly child: Node; readonly parent: Node | undefined } {
		let child = node;
		let parent = node.getParent();
		while (parent !== undefined && (Node.isParenthesizedExpression(parent) || Node.isAsExpression(parent) || Node.isNonNullExpression(parent) || Node.isSatisfiesExpression(parent))) {
			child = parent;
			parent = parent.getParent();
		}
		return { child, parent };
	}

	private isModuleConstruction(call: Node): boolean {
		if (!Node.isNewExpression(call)) {
			return false;
		}
		const declaredIn = call.getType().getSymbol()?.getDeclarations()[0]?.getSourceFile().getFilePath();
		return declaredIn !== undefined && this.scope.readsWiring(declaredIn);
	}

	private isName(node: Node): boolean {
		const parent = node.getParent();
		return parent !== undefined && Node.hasName(parent) && parent.getNameNode() === node;
	}
}
