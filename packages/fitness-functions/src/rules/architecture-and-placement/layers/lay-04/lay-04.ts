import type { Codebase } from '../../../../codebase/codebase.ts';
import { Placement } from '../../../../layout/placement.ts';
import type { Violation } from '../../../../violations/violation.ts';
import { FitnessFunction } from '../../../fitness-function.ts';
import { Rule } from '../../../rule.ts';

export class Lay04 extends FitnessFunction {
	public readonly rule: Rule = new Rule(
		'LAY-04',
		'Un autre bounded context n’entre que par `public`, qui ne contient que le contrat',
		'https://alveolus.dev/rules/architecture-and-placement/layers/lay-04',
	);

	public check(codebase: Codebase): Violation[] {
		const violations: Violation[] = [];

		for (const file of codebase.files) {
			const source = Placement.of(file.path);

			if (source === undefined) {
				continue;
			}

			for (const dependency of file.dependencies) {
				if (dependency.target === undefined) {
					continue;
				}

				const target = Placement.of(dependency.target);

				if (target === undefined || !target.isInAnotherContextThan(source) || target.isPublic()) {
					continue;
				}

				const message = `imports ${dependency.target}, outside ${target.publicFolder()}`;
				violations.push(this.violation(file.path, dependency.line, message));
			}
		}

		return violations;
	}
}
