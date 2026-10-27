import type { AST, Rule as EslintRule } from 'eslint';

import type { Rule } from '../rule.ts';
import { ModuleTargets } from './module-targets.ts';

type ImportSource = {
	readonly type: string;
	readonly value?: unknown;
	readonly loc?: AST.SourceLocation | null | undefined;
};

export abstract class ImportBoundary {
	readonly #rule: Rule;

	protected constructor(rule: Rule) {
		this.#rule = rule;
	}

	public module(): EslintRule.RuleModule {
		return {
			meta: {
				type: 'problem',
				docs: { description: this.#rule.title, url: this.#rule.url },
				schema: [],
				messages: { crosses: `reaches {{target}}. ${this.#rule.describe()}` },
			},
			create: (context) => this.#visitors(context),
		};
	}

	protected abstract crosses(from: string, to: string): boolean;

	#visitors(context: EslintRule.RuleContext): EslintRule.RuleListener {
		const program: unknown = context.sourceCode.parserServices?.program;

		if (!ModuleTargets.isProgram(program)) {
			return {};
		}

		const targets = new ModuleTargets(program, context.cwd);
		const from = targets.path(context.filename);
		const check = (source: ImportSource | null | undefined): void => {
			if (source?.type !== 'Literal' || typeof source.value !== 'string' || !source.loc) {
				return;
			}

			const target = targets.resolve(source.value, context.filename);

			if (target !== undefined && this.crosses(from, target)) {
				context.report({ loc: source.loc, messageId: 'crosses', data: { target } });
			}
		};

		return {
			ImportDeclaration: (node) => check(node.source),
			ExportNamedDeclaration: (node) => check(node.source),
			ExportAllDeclaration: (node) => check(node.source),
			ImportExpression: (node) => check(node.source),
		};
	}
}
