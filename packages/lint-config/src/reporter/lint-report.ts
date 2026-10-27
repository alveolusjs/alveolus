import { readFileSync } from 'node:fs';
import { relative } from 'node:path';

import type { ESLint, Linter } from 'eslint';

import { rules } from '../rules.ts';
import { CodeFrame } from './code-frame.ts';
import { Summary } from './summary.ts';

const alveolusCode = /\b([A-Z]{2,3}-\d{2}) · /;

export class LintReport {
	readonly #results: readonly ESLint.LintResult[];
	readonly #context: ESLint.LintResultData;

	public constructor(results: readonly ESLint.LintResult[], context: ESLint.LintResultData) {
		this.#results = results;
		this.#context = context;
	}

	public render(): string {
		const blocks: string[] = [];
		let errors = 0;
		let warnings = 0;

		for (const result of this.#results) {
			const path = relative(this.#context.cwd, result.filePath).replaceAll('\\', '/');
			const frame = new CodeFrame(path, result.source ?? this.#read(result.filePath));

			for (const message of result.messages) {
				if (message.severity === 2) {
					errors += 1;
				} else {
					warnings += 1;
				}

				blocks.push(this.#block(message, frame).join('\n'));
			}
		}

		blocks.push(new Summary(errors, warnings).toString());

		return blocks.join('\n\n');
	}

	#block(message: Linter.LintMessage, frame: CodeFrame): string[] {
		const icon = message.severity === 2 ? '×' : '⚠';
		const match = alveolusCode.exec(message.message);
		const rule = rules.find((candidate) => candidate.code === match?.[1]);
		const span = frame.span(message.line, message.column, message.endLine, message.endColumn);

		if (rule !== undefined && match !== null) {
			return [
				`  ${icon} ${rule.code}: ${rule.title}`,
				...frame.render(span, this.#label(message.message.slice(0, match.index))),
				`  help: ${rule.url}`,
			];
		}

		const help = this.#help(message.ruleId);

		return [
			`  ${icon} ${message.ruleId ?? 'eslint'}: ${message.message}`,
			...frame.render(span),
			...(help === undefined ? [] : [`  help: ${help}`]),
		];
	}

	#label(prefix: string): string | undefined {
		const label = prefix.trim().replace(/\.$/, '');

		return label === '' ? undefined : label;
	}

	#help(ruleId: string | null): string | undefined {
		return ruleId === null ? undefined : this.#context.rulesMeta[ruleId]?.docs?.url;
	}

	#read(path: string): string {
		try {
			return readFileSync(path, 'utf8');
		} catch {
			return '';
		}
	}
}
