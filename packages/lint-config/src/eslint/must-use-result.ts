import type { Rule as EslintRule } from 'eslint';
import ts from 'typescript';

import type { Rule } from '../rule.ts';
import { ModuleTargets } from './module-targets.ts';

type Statement = {
	readonly expression: { readonly type: string; readonly range?: [number, number] | undefined };
};

export class MustUseResult {
	readonly #rule: Rule;

	public constructor(rule: Rule) {
		this.#rule = rule;
	}

	public module(): EslintRule.RuleModule {
		return {
			meta: {
				type: 'problem',
				docs: { description: this.#rule.title, url: this.#rule.url },
				schema: [],
				messages: { dropped: `This Result is dropped: test its ok, or return it. ${this.#rule.describe()}` },
			},
			create: (context) => this.#visitors(context),
		};
	}

	#visitors(context: EslintRule.RuleContext): EslintRule.RuleListener {
		const program: unknown = context.sourceCode.parserServices?.program;

		if (!ModuleTargets.isProgram(program)) {
			return {};
		}

		const source = program.getSourceFile(context.filename);
		const checker = program.getTypeChecker();

		if (source === undefined) {
			return {};
		}

		return {
			ExpressionStatement: (node) => {
				const range = this.#range(node);
				const expression = range === undefined ? undefined : this.#node(source, range);

				if (expression !== undefined && this.#isResult(checker, this.#dropped(checker, expression))) {
					context.report({ node, messageId: 'dropped' });
				}
			},
		};
	}

	#range(statement: Statement): [number, number] | undefined {
		return statement.expression.range;
	}

	#node(source: ts.SourceFile, [start, end]: [number, number]): ts.Expression | undefined {
		let found: ts.Expression | undefined;
		const visit = (node: ts.Node): void => {
			if (node.getStart(source) <= start && node.getEnd() >= end) {
				if (ts.isExpression(node) && node.getStart(source) === start && node.getEnd() === end) {
					found = node;
				}

				ts.forEachChild(node, visit);
			}
		};

		visit(source);

		return found;
	}

	#dropped(checker: ts.TypeChecker, expression: ts.Expression): ts.Type {
		const inner = ts.isParenthesizedExpression(expression) ? expression.expression : expression;

		if (ts.isVoidExpression(inner)) {
			const type = checker.getTypeAtLocation(inner.expression);

			return checker.getAwaitedType(type) ?? type;
		}

		return checker.getTypeAtLocation(inner);
	}

	#isResult(checker: ts.TypeChecker, type: ts.Type): boolean {
		if (!type.isUnion()) {
			return false;
		}

		const outcomes = type.types;

		return (
			outcomes.every((outcome) => this.#ok(checker, outcome) !== undefined) &&
			outcomes.some((outcome) => outcome.getProperty('value') !== undefined) &&
			outcomes.some((outcome) => outcome.getProperty('error') !== undefined)
		);
	}

	#ok(checker: ts.TypeChecker, outcome: ts.Type): boolean | undefined {
		const ok = outcome.getProperty('ok');

		if (ok === undefined) {
			return undefined;
		}

		const type = checker.getTypeOfSymbol(ok);

		if (type.flags & ts.TypeFlags.BooleanLiteral) {
			return checker.typeToString(type) === 'true';
		}

		return undefined;
	}
}
