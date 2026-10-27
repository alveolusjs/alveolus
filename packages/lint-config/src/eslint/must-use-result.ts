import type { Rule as EslintRule } from 'eslint';

import type { Rule } from '../rule.ts';
import { ResultTypes } from './result-types.ts';

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
		const results = ResultTypes.of(context);

		if (results === undefined) {
			return {};
		}

		return {
			ExpressionStatement: (node) => {
				const { expression } = node;

				if (expression.type === 'AssignmentExpression') {
					return;
				}

				const dropped =
					expression.type === 'UnaryExpression' && expression.operator === 'void'
						? results.isAwaitedResult(expression.argument)
						: results.isResult(expression);

				if (dropped) {
					context.report({ node, messageId: 'dropped' });
				}
			},
		};
	}
}
