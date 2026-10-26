import { Codebase } from './codebase/codebase.ts';
import type { FitnessFunction } from './rules/fitness-function.ts';
import { registry } from './rules/registry.ts';
import type { Rule } from './rules/rule.ts';
import type { RuleCode } from './rules/rule-code.ts';
import type { Violation } from './violations/violation.ts';

export class FitnessFunctions {
	private readonly functions: ReadonlyMap<RuleCode, FitnessFunction> = new Map(
		registry.map((fitnessFunction) => [fitnessFunction.rule.code, fitnessFunction]),
	);

	private constructor(private readonly codebase: Codebase) {}

	public static of(directory: string): FitnessFunctions {
		return new FitnessFunctions(Codebase.read(directory));
	}

	public rule(code: RuleCode): Rule {
		return this.fitnessFunction(code).rule;
	}

	public check(code: RuleCode): Violation[] {
		return this.fitnessFunction(code).check(this.codebase);
	}

	private fitnessFunction(code: RuleCode): FitnessFunction {
		const fitnessFunction = this.functions.get(code);

		if (fitnessFunction === undefined) {
			throw new Error(`${code} has no fitness function yet`);
		}

		return fitnessFunction;
	}
}
