import { Node, SyntaxKind } from "ts-morph";
import type { SourceFile } from "ts-morph";

import { normalize } from "node:path";

import type { WiringLink } from "../../../model/index.ts";
import { Wiring } from "../../../model/index.ts";
import type { ImportScope } from "../../importer.ts";
import type { TypeReader } from "./type-reader.ts";

interface Site {
	readonly receiver: Node | undefined;
	readonly values: readonly Node[];
}

const references: readonly SyntaxKind[] = [SyntaxKind.Identifier, SyntaxKind.PropertyAccessExpression];

export class WiringReader {
	public constructor(
		private readonly types: TypeReader,
		private readonly scope: ImportScope,
	) {}

	public read(file: SourceFile): Wiring[] {
		if (!this.scope.readsWiring(file.getFilePath())) {
			return [];
		}
		const wirings: Wiring[] = [];
		for (const site of this.sitesOf(file)) {
			const receiver = this.declaringFileOf(site.receiver);
			if (receiver === undefined) {
				continue;
			}
			for (const value of site.values) {
				for (const reference of this.referencesIn(value)) {
					wirings.push(new Wiring(reference.getStartLineNumber(), receiver, this.linksOf(reference)));
				}
			}
		}
		return wirings;
	}

	private sitesOf(file: SourceFile): Site[] {
		const sites: Site[] = [];
		file.forEachDescendant((node) => {
			if (Node.isCallExpression(node) || Node.isNewExpression(node)) {
				sites.push({ receiver: node.getExpression(), values: node.getArguments() });
			} else if (Node.isBinaryExpression(node) && node.getOperatorToken().isKind(SyntaxKind.EqualsToken)) {
				sites.push({ receiver: node.getLeft(), values: [node.getRight()] });
			} else if ((Node.isVariableDeclaration(node) || Node.isPropertyDeclaration(node)) && node.getTypeNode() !== undefined) {
				const initializer = node.getInitializer();
				sites.push({ receiver: node.getTypeNode(), values: initializer === undefined ? [] : [initializer] });
			}
		});
		return sites;
	}

	private referencesIn(value: Node): Node[] {
		const found: Node[] = [];
		const visit = (node: Node): void => {
			if (this.isOutermostReference(node)) {
				found.push(node);
			}
			node.forEachChild(visit);
		};
		visit(value);
		return found;
	}

	private isOutermostReference(node: Node): boolean {
		if (!references.includes(node.getKind())) {
			return false;
		}
		const parent = node.getParent();
		if (parent === undefined || Node.isPropertyAccessExpression(parent)) {
			return false;
		}
		if (Node.isTypeNode(parent) || Node.isQualifiedName(parent) || Node.isExpressionWithTypeArguments(parent)) {
			return false;
		}
		return Node.isShorthandPropertyAssignment(parent) || !(Node.hasName(parent) && parent.getNameNode() === node);
	}

	private linksOf(reference: Node): WiringLink[] {
		if (Node.isPropertyAccessExpression(reference)) {
			return [...this.linksOf(reference.getExpression()), this.link(reference, reference.getNameNode())];
		}
		if (Node.isIdentifier(reference)) {
			return [this.link(reference, reference)];
		}
		return [];
	}

	private link(expression: Node, name: Node): WiringLink {
		return { declaredIn: this.declaringFileOf(name), text: expression.getText(), types: this.types.classTypesIn(expression.getType()) };
	}

	private declaringFileOf(node: Node | undefined): string | undefined {
		if (node === undefined) {
			return undefined;
		}
		const named = Node.isTypeNode(node) ? (node.getType().getAliasSymbol() ?? node.getType().getSymbol()) : this.nameOf(node).getSymbol();
		const symbol = named?.isAlias() === true ? named.getAliasedSymbol() : named;
		const declaration = symbol?.getDeclarations()[0];
		return declaration === undefined ? undefined : normalize(declaration.getSourceFile().getFilePath());
	}

	private nameOf(node: Node): Node {
		return Node.isPropertyAccessExpression(node) ? node.getNameNode() : node;
	}
}
