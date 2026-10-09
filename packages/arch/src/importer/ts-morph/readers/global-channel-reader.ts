import { Node, SyntaxKind } from "ts-morph";
import type { CallExpression, SourceFile } from "ts-morph";

import type { GlobalAccess } from "../../../model/index.ts";
import { GlobalChannel } from "../../../model/index.ts";

const globalObjects: readonly string[] = ["globalThis", "global", "window", "self"];

const assignments: readonly SyntaxKind[] = [
	SyntaxKind.EqualsToken,
	SyntaxKind.QuestionQuestionEqualsToken,
	SyntaxKind.BarBarEqualsToken,
	SyntaxKind.AmpersandAmpersandEqualsToken,
	SyntaxKind.PlusEqualsToken,
];

const reflectionWrites: readonly string[] = ["set", "defineProperty", "deleteProperty"];

const objectWrites: readonly string[] = ["defineProperty", "defineProperties", "assign"];

export class GlobalChannelReader {
	public read(file: SourceFile): GlobalChannel[] {
		const channels: GlobalChannel[] = [];
		file.forEachDescendant((node) => {
			channels.push(...this.channelsAt(node));
		});
		return channels;
	}

	private channelsAt(node: Node): GlobalChannel[] {
		if (Node.isPropertyAccessExpression(node)) {
			return this.lookup(node, node.getExpression(), node.getName());
		}
		if (Node.isElementAccessExpression(node)) {
			const key = node.getArgumentExpression();
			return key !== undefined && Node.isStringLiteral(key) ? this.lookup(node, node.getExpression(), key.getLiteralValue()) : [];
		}
		if (Node.isCallExpression(node)) {
			return this.reflected(node);
		}
		return [];
	}

	private lookup(access: Node, object: Node, name: string): GlobalChannel[] {
		const global = this.globalObject(object);
		if (global === undefined || global.getType().getProperty(name) !== undefined) {
			return [];
		}
		return [new GlobalChannel(access.getStartLineNumber(), `${global.getText()}.${name}`, this.accessOf(access))];
	}

	private reflected(call: CallExpression): GlobalChannel[] {
		const callee = call.getExpression();
		if (!Node.isPropertyAccessExpression(callee)) {
			return [];
		}
		const owner = callee.getExpression().getText();
		const method = callee.getName();
		const [target, key] = call.getArguments();
		const global = target === undefined ? undefined : this.globalObject(target);
		if (global === undefined) {
			return [];
		}
		if (owner === "Reflect" && key !== undefined && Node.isStringLiteral(key)) {
			const access: GlobalAccess = reflectionWrites.includes(method) ? "writes" : "reads";
			return this.undeclared(global, [key.getLiteralValue()], call.getStartLineNumber(), access);
		}
		if (owner === "Object" && objectWrites.includes(method) && key !== undefined) {
			const names = Node.isStringLiteral(key) ? [key.getLiteralValue()] : this.propertyNames(key);
			return this.undeclared(global, names, call.getStartLineNumber(), "writes");
		}
		return [];
	}

	private undeclared(global: Node, names: readonly string[], line: number, access: GlobalAccess): GlobalChannel[] {
		const type = global.getType();
		return names.filter((name) => type.getProperty(name) === undefined).map((name) => new GlobalChannel(line, `${global.getText()}.${name}`, access));
	}

	private propertyNames(node: Node): string[] {
		if (!Node.isObjectLiteralExpression(node)) {
			return [];
		}
		const names: string[] = [];
		for (const property of node.getProperties()) {
			if (Node.isPropertyAssignment(property) || Node.isShorthandPropertyAssignment(property) || Node.isMethodDeclaration(property)) {
				names.push(property.getName());
			}
		}
		return names;
	}

	private globalObject(node: Node): Node | undefined {
		const bare = this.unwrapped(node);
		if (!Node.isIdentifier(bare) || !globalObjects.includes(bare.getText())) {
			return undefined;
		}
		const declaration = bare.getSymbol()?.getDeclarations()[0];
		return declaration === undefined || declaration.getSourceFile().isDeclarationFile() ? bare : undefined;
	}

	private accessOf(access: Node): GlobalAccess {
		const parent = access.getParent();
		if (Node.isBinaryExpression(parent) && parent.getLeft() === access && assignments.includes(parent.getOperatorToken().getKind())) {
			return "writes";
		}
		return Node.isDeleteExpression(parent) ? "writes" : "reads";
	}

	private unwrapped(node: Node): Node {
		if (Node.isParenthesizedExpression(node) || Node.isAsExpression(node) || Node.isNonNullExpression(node) || Node.isSatisfiesExpression(node)) {
			return this.unwrapped(node.getExpression());
		}
		return node;
	}
}
