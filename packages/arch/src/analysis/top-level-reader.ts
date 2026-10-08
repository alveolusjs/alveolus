import { ModuleDeclarationKind, Node, SyntaxKind, VariableDeclarationKind } from "ts-morph";
import type { Expression, SourceFile, Statement, VariableDeclaration, VariableStatement } from "ts-morph";

import type { DeclarationKind } from "../codebase/index.ts";
import { Declaration } from "../codebase/index.ts";

/** Statements that only declare what other files import or what TypeScript checks. */
const declarative: ReadonlySet<SyntaxKind> = new Set([
	SyntaxKind.ImportDeclaration,
	SyntaxKind.ImportEqualsDeclaration,
	SyntaxKind.ExportDeclaration,
	SyntaxKind.ClassDeclaration,
	SyntaxKind.InterfaceDeclaration,
	SyntaxKind.TypeAliasDeclaration,
	SyntaxKind.EmptyStatement,
]);

const literals: ReadonlySet<SyntaxKind> = new Set([
	SyntaxKind.StringLiteral,
	SyntaxKind.NumericLiteral,
	SyntaxKind.BigIntLiteral,
	SyntaxKind.NoSubstitutionTemplateLiteral,
	SyntaxKind.RegularExpressionLiteral,
	SyntaxKind.TrueKeyword,
	SyntaxKind.FalseKeyword,
	SyntaxKind.NullKeyword,
]);

/** Reads the top-level statements of a file that are neither a class, a type, an import nor a constant of plain data. */
export class TopLevelReader {
	public read(file: SourceFile): Declaration[] {
		return file.getStatements().flatMap((statement) => this.declarationsOf(statement));
	}

	private declarationsOf(statement: Statement): Declaration[] {
		if (declarative.has(statement.getKind())) {
			return [];
		}
		const line = statement.getStartLineNumber();
		if (Node.isFunctionDeclaration(statement)) {
			return [new Declaration("function", statement.getName() ?? "default", line)];
		}
		if (Node.isEnumDeclaration(statement)) {
			return [new Declaration("enum", statement.getName(), line)];
		}
		if (Node.isModuleDeclaration(statement)) {
			return statement.getDeclarationKind() === ModuleDeclarationKind.Global ? [] : [new Declaration("namespace", statement.getName(), line)];
		}
		if (Node.isVariableStatement(statement)) {
			return this.variablesOf(statement);
		}
		if (Node.isExportAssignment(statement)) {
			return this.isData(statement.getExpression()) ? [] : [new Declaration("computed constant", "default", line)];
		}
		return [new Declaration("statement", statement.getKindName(), line)];
	}

	private variablesOf(statement: VariableStatement): Declaration[] {
		const isConstant = statement.getDeclarationKind() === VariableDeclarationKind.Const;
		const declarations: Declaration[] = [];
		for (const variable of statement.getDeclarations()) {
			const kind = isConstant ? this.constantKindOf(variable) : "mutable variable";
			if (kind !== undefined) {
				declarations.push(new Declaration(kind, variable.getName(), variable.getStartLineNumber()));
			}
		}
		return declarations;
	}

	private constantKindOf(variable: VariableDeclaration): DeclarationKind | undefined {
		const initializer = variable.getInitializer();
		if (initializer === undefined) {
			return undefined;
		}
		const value = this.unwrapped(initializer);
		if (Node.isClassExpression(value)) {
			return "class expression";
		}
		if (value.getType().getCallSignatures().length > 0) {
			return "function";
		}
		return this.isData(initializer) ? undefined : "computed constant";
	}

	/** Plain data: literals, arrays and objects of data, arithmetic on data, and references to values that cannot be called. */
	private isData(expression: Expression): boolean {
		const value = this.unwrapped(expression);
		if (literals.has(value.getKind())) {
			return true;
		}
		if (Node.isPrefixUnaryExpression(value)) {
			return this.isData(value.getOperand());
		}
		if (Node.isBinaryExpression(value)) {
			return this.isData(value.getLeft()) && this.isData(value.getRight());
		}
		if (Node.isTemplateExpression(value)) {
			return value.getTemplateSpans().every((span) => this.isData(span.getExpression()));
		}
		if (Node.isArrayLiteralExpression(value)) {
			return value.getElements().every((element) => this.isData(Node.isSpreadElement(element) ? element.getExpression() : element));
		}
		if (Node.isObjectLiteralExpression(value)) {
			return value.getProperties().every((property) => this.isDataProperty(property));
		}
		if (Node.isIdentifier(value) || Node.isPropertyAccessExpression(value)) {
			return value.getType().getCallSignatures().length === 0;
		}
		return false;
	}

	private isDataProperty(property: Node): boolean {
		if (Node.isPropertyAssignment(property)) {
			const initializer = property.getInitializer();
			return initializer !== undefined && this.isData(initializer);
		}
		if (Node.isShorthandPropertyAssignment(property)) {
			return property.getNameNode().getType().getCallSignatures().length === 0;
		}
		if (Node.isSpreadAssignment(property)) {
			return this.isData(property.getExpression());
		}
		return false;
	}

	/** Looks through parentheses, `as`, `satisfies` and `!`, which change the type but not the value. */
	private unwrapped(expression: Expression): Expression {
		if (Node.isParenthesizedExpression(expression) || Node.isAsExpression(expression) || Node.isSatisfiesExpression(expression) || Node.isNonNullExpression(expression)) {
			return this.unwrapped(expression.getExpression());
		}
		if (Node.isTypeAssertion(expression)) {
			return this.unwrapped(expression.getExpression());
		}
		return expression;
	}
}
