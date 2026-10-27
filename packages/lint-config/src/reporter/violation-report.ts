import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ICruiseResult, IReporterOutput, IViolation } from 'dependency-cruiser';

import { rules } from '../rules.ts';
import { CodeFrame } from './code-frame.ts';
import { Summary } from './summary.ts';

export class ViolationReport {
	readonly #result: ICruiseResult;
	readonly #directory: string;

	public constructor(result: ICruiseResult, directory: string) {
		this.#result = result;
		this.#directory = directory;
	}

	public render(): IReporterOutput {
		const blocks: string[] = [];
		const cycles = new Set<string>();
		let errors = 0;
		let warnings = 0;

		for (const violation of this.#result.summary.violations) {
			if (violation.rule.severity === 'ignore' || violation.rule.severity === 'info') {
				continue;
			}

			if (violation.cycle !== undefined) {
				const key = [...new Set(violation.cycle.map((step) => step.name))].toSorted().join(' ');

				if (cycles.has(key)) {
					continue;
				}

				cycles.add(key);
			}

			if (violation.rule.severity === 'error') {
				errors += 1;
			} else {
				warnings += 1;
			}

			blocks.push(this.#block(violation).join('\n'));
		}

		blocks.push(new Summary(errors, warnings).toString());

		return { output: `${blocks.join('\n\n')}\n`, exitCode: errors };
	}

	#block(violation: IViolation): string[] {
		const rule = rules.find((candidate) => candidate.code === violation.rule.name);
		const icon = violation.rule.severity === 'error' ? '×' : '⚠';
		const rows = [`  ${icon} ${violation.rule.name}${rule === undefined ? '' : `: ${rule.title}`}`];

		rows.push(...this.#body(violation));

		if (rule !== undefined) {
			rows.push(`  help: ${rule.url}`);
		}

		return rows;
	}

	#body(violation: IViolation): string[] {
		if (violation.cycle !== undefined) {
			return [`  │ ${[violation.from, ...violation.cycle.map((step) => step.name)].join(' → ')}`];
		}

		const frame = this.#frame(violation.from);
		const span = violation.unresolvedTo === undefined ? undefined : frame?.locate(violation.unresolvedTo);

		if (frame === undefined || span === undefined) {
			return [`  │ ${violation.from} → ${violation.to}`];
		}

		return frame.render(span, violation.to);
	}

	#frame(path: string): CodeFrame | undefined {
		try {
			return new CodeFrame(path, readFileSync(join(this.#directory, path), 'utf8'));
		} catch {
			return undefined;
		}
	}
}
