import { Node } from "ts-morph";
import type { CallExpression, NewExpression, SourceFile } from "ts-morph";

export interface Load {
	readonly line: number;
	readonly loader: string;
}

const globalObjects: readonly string[] = ["globalThis", "global", "window", "self"];

const globalLoaders: readonly string[] = ["eval", "Function"];

const loaderMembers: readonly string[] = ["eval", "Function", "require", "getBuiltinModule"];

const reflections: readonly string[] = ["get", "apply", "construct"];

export class LoaderReader {
	public read(file: SourceFile): Load[] {
		const loads: Load[] = [];
		file.forEachDescendant((node) => {
			const loader = this.loaderAt(node);
			if (loader !== undefined) {
				loads.push({ line: node.getStartLineNumber(), loader });
			}
		});
		return loads;
	}

	private loaderAt(node: Node): string | undefined {
		if (Node.isCallExpression(node) || Node.isNewExpression(node)) {
			return this.calledLoader(node);
		}
		if (Node.isElementAccessExpression(node)) {
			return this.globalLookup(node.getExpression(), node.getArgumentExpression());
		}
		return undefined;
	}

	private calledLoader(call: CallExpression | NewExpression): string | undefined {
		const callee = call.getExpression();
		const bare = this.unwrapped(callee);
		if (Node.isElementAccessExpression(bare)) {
			return undefined;
		}
		const reflected = this.reflectedLoader(bare, call.getArguments());
		if (reflected !== undefined) {
			return reflected;
		}
		return this.namedLoader(bare) ?? this.typedLoader(callee) ?? this.typedLoader(bare);
	}

	private reflectedLoader(callee: Node, args: readonly Node[]): string | undefined {
		if (!Node.isPropertyAccessExpression(callee) || callee.getExpression().getText() !== "Reflect" || !reflections.includes(callee.getName())) {
			return undefined;
		}
		const [target, key] = args;
		if (target === undefined) {
			return undefined;
		}
		if (callee.getName() === "get") {
			return this.globalLookup(target, key);
		}
		const bare = this.unwrapped(target);
		return this.namedLoader(bare) ?? this.typedLoader(target) ?? this.typedLoader(bare);
	}

	private globalLookup(object: Node, key: Node | undefined): string | undefined {
		const bare = this.unwrapped(object);
		if (!Node.isIdentifier(bare) || !globalObjects.includes(bare.getText()) || !this.isFromLibrary(bare)) {
			return undefined;
		}
		if (key === undefined || !Node.isStringLiteral(key)) {
			return `${bare.getText()}[…]`;
		}
		return globalLoaders.includes(key.getLiteralValue()) ? `${bare.getText()}.${key.getLiteralValue()}` : undefined;
	}

	private namedLoader(callee: Node): string | undefined {
		if (Node.isIdentifier(callee)) {
			return globalLoaders.includes(callee.getText()) && this.isFromLibrary(callee) ? callee.getText() : undefined;
		}
		if (!Node.isPropertyAccessExpression(callee)) {
			return undefined;
		}
		if (loaderMembers.includes(callee.getName())) {
			return callee.getText();
		}
		if (callee.getName() === "constructor") {
			const owner = callee.getExpression().getType();
			return owner.isAny() || owner.getCallSignatures().length > 0 ? callee.getText() : undefined;
		}
		return undefined;
	}

	private typedLoader(callee: Node): string | undefined {
		const symbol = callee.getType().getSymbol();
		if (symbol?.getName() === "FunctionConstructor") {
			return "Function";
		}
		const declaration = symbol?.getDeclarations()[0];
		if (symbol?.getName() === "eval" && declaration?.getSourceFile().isDeclarationFile() === true) {
			return "eval";
		}
		return undefined;
	}

	private isFromLibrary(identifier: Node): boolean {
		const declaration = identifier.getSymbol()?.getDeclarations()[0];
		return declaration === undefined || declaration.getSourceFile().isDeclarationFile();
	}

	private unwrapped(expression: Node): Node {
		if (Node.isParenthesizedExpression(expression) || Node.isAsExpression(expression) || Node.isNonNullExpression(expression) || Node.isSatisfiesExpression(expression)) {
			return this.unwrapped(expression.getExpression());
		}
		if (Node.isBinaryExpression(expression) && expression.getOperatorToken().getText() === ",") {
			return this.unwrapped(expression.getRight());
		}
		return expression;
	}
}
