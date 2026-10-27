import type { Rule as EslintRule } from 'eslint';
import tseslint from 'typescript-eslint';

import type { Rule } from '../rule.ts';

export class ReexposedRule {
	readonly #rule: Rule;
	readonly #name: string;

	public constructor(rule: Rule, name: string) {
		this.#rule = rule;
		this.#name = name;
	}

	public module(): EslintRule.RuleModule {
		const original = this.#original();
		const meta = this.#field(original, 'meta');
		const fixable = this.#field(meta, 'fixable');

		return {
			meta: {
				type: 'problem',
				docs: { description: this.#rule.title, url: this.#rule.url },
				schema: false,
				messages: this.#messages(meta),
				...(fixable === 'code' || fixable === 'whitespace' ? { fixable } : {}),
				...(this.#field(meta, 'hasSuggestions') === true ? { hasSuggestions: true } : {}),
			},
			create: (context) => this.#create(original, context),
		};
	}

	#original(): unknown {
		const rules: unknown = 'rules' in tseslint.plugin ? tseslint.plugin.rules : undefined;
		const original = this.#field(rules, this.#name);

		if (typeof this.#field(original, 'create') !== 'function') {
			throw new Error(`typescript-eslint has no rule ${this.#name}`);
		}

		return original;
	}

	#create(original: unknown, context: EslintRule.RuleContext): EslintRule.RuleListener {
		const create = this.#field(original, 'create');

		return typeof create === 'function' ? Reflect.apply(create, original, [context]) : {};
	}

	#messages(meta: unknown): Record<string, string> {
		const messages: Record<string, string> = {};
		const originals = this.#field(meta, 'messages');

		if (typeof originals !== 'object' || originals === null) {
			return messages;
		}

		for (const [id, text] of Object.entries(originals)) {
			if (typeof text === 'string') {
				messages[id] = `${text} ${this.#rule.describe()}`;
			}
		}

		return messages;
	}

	#field(value: unknown, key: string): unknown {
		if (typeof value !== 'object' || value === null) {
			return undefined;
		}

		return Object.entries(value).find(([name]) => name === key)?.[1];
	}
}
