import type { Rule as EslintRule } from 'eslint';

import { ResultTypes } from './result-types.ts';

type ReportedNode = Extract<EslintRule.ReportDescriptor, { node: unknown }>['node'];

export class ResultReports {
	readonly #module: EslintRule.RuleModule;

	public constructor(module: EslintRule.RuleModule) {
		this.#module = module;
	}

	public module(): EslintRule.RuleModule {
		return { ...this.#module, create: (context) => this.#create(context) };
	}

	#create(context: EslintRule.RuleContext): EslintRule.RuleListener {
		const results = ResultTypes.of(context);

		if (results === undefined) {
			return {};
		}

		const report = (descriptor: EslintRule.ReportDescriptor): void => {
			if ('node' in descriptor && this.#holdsResult(results, descriptor.node)) {
				context.report(descriptor);
			}
		};
		const filtered: EslintRule.RuleContext = Object.create(context, { report: { value: report } });

		return this.#module.create(filtered);
	}

	#holdsResult(results: ResultTypes, node: ReportedNode): boolean {
		if (node.type === 'ExpressionStatement') {
			return results.isAwaitedResult(node);
		}

		return results.isVariable(node) && results.isAwaitedResult(node);
	}
}
