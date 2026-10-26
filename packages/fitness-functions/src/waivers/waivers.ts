import type { SourceFile } from '../codebase/source-file.ts';
import type { Rule } from '../rules/rule.ts';
import { Violation } from '../violations/violation.ts';
import { WaivedViolation } from '../violations/waived-violation.ts';
import { Waiver } from './waiver.ts';
import { WaiverReview } from './waiver-review.ts';

const waiverComment = /^waiver ([A-Z]+-\d{2})\b(.*)$/;

export class Waivers {
	private constructor(
		private readonly rule: Rule,
		private readonly waivers: readonly Waiver[],
	) {}

	public static of(rule: Rule, files: readonly SourceFile[]): Waivers {
		const waivers: Waiver[] = [];

		for (const file of files) {
			for (const comment of file.comments) {
				const [, code, rest = ''] = waiverComment.exec(comment.text) ?? [];

				if (code === rule.code) {
					waivers.push(new Waiver(code, Waivers.reasonIn(rest), file.path, comment.line));
				}
			}
		}

		return new Waivers(rule, waivers);
	}

	private static reasonIn(rest: string): string | undefined {
		const reason = rest.startsWith(':') ? rest.slice(1).trim() : '';

		return reason === '' ? undefined : reason;
	}

	public review(violations: readonly Violation[]): WaiverReview {
		const remaining: Violation[] = [];
		const waived: WaivedViolation[] = [];
		const used = new Set<Waiver>();

		for (const violation of violations) {
			const waiver = this.waivers.find(
				(candidate) => candidate.reason !== undefined && candidate.covers(violation),
			);

			if (waiver === undefined || waiver.reason === undefined) {
				remaining.push(violation);
			} else {
				waived.push(new WaivedViolation(violation, waiver.reason));
				used.add(waiver);
			}
		}

		for (const waiver of this.waivers) {
			if (waiver.reason === undefined) {
				const message = `waiver ${waiver.code} gives no reason: say why, and cite the ADR when it is structural`;
				remaining.push(new Violation(this.rule, waiver.file, waiver.line, message));
			} else if (!used.has(waiver)) {
				remaining.push(
					new Violation(
						this.rule,
						waiver.file,
						waiver.line,
						`waiver ${waiver.code} covers no violation: remove it`,
					),
				);
			}
		}

		return new WaiverReview(remaining, waived);
	}
}
