import { ModuleDeclarationKind, Node, SyntaxKind, VariableDeclarationKind } from "ts-morph";
import type { Expression, SourceFile, Statement, VariableDeclaration, VariableStatement } from "ts-morph";

import type { StatementKind } from "../../../model/index.ts";
import { TopLevelStatement } from "../../../model/index.ts";

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

export class StatementReader {
	public read(file: SourceFile): TopLevelStatement[] {
		return file.getStatements().flatMap((statement) => this.declarationsOf(statement));
	}

	private declarationsOf(statement: Statement): TopLevelStatement[] {
		if (declarative.has(statement.getKind())) {
			return [];
		}
		const line = statement.getStartLineNumber();
		if (Node.isFunctionDeclaration(statement)) {
			return [new TopLevelStatement("function", statement.getName() ?? "default", line)];
		}
		if (Node.isEnumDeclaration(statement)) {
			return [new TopLevelStatement("enum", statement.getName(), line)];
		}
		if (Node.isModuleDeclaration(statement)) {
			return statement.getDeclarationKind() === ModuleDeclarationKind.Global ? [] : [new TopLevelStatement("namespace", statement.getName(), line)];
		}
		if (Node.isVariableStatement(statement)) {
			return this.variablesOf(statement);
		}
		if (Node.isExportAssignment(statement)) {
			return this.isData(statement.getExpression()) ? [] : [new TopLevelStatement("computed constant", "default", line)];
		}
		return [new TopLevelStatement("statement", statement.getKindName(), line)];
	}

	private variablesOf(statement: VariableStatement): TopLevelStatement[] {
		const isConstant = statement.getDeclarationKind() === VariableDeclarationKind.Const;
		const declarations: TopLevelStatement[] = [];
		for (const variable of statement.getDeclarations()) {
			const kind = isConstant ? this.constantKindOf(variable) : "mutable variable";
			if (kind !== undefined) {
				declarations.push(new TopLevelStatement(kind, variable.getName(), variable.getStartLineNumber()));
			}
		}
		return declarations;
	}

	private constantKindOf(variable: VariableDeclaration): StatementKind | undefined {
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
