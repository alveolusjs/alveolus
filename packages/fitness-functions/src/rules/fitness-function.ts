import type { Codebase } from '../codebase/codebase.ts';
import { Violation } from '../violations/violation.ts';
import type { Rule } from './rule.ts';

export abstract class FitnessFunction {
	public abstract readonly rule: Rule;

	public abstract check(codebase: Codebase): Violation[];

	protected violation(file: string, line: number, message: string): Violation {
		return new Violation(this.rule, file, line, message);
	}
}
