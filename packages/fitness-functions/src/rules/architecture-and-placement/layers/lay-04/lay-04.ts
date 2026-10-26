import type { Placement } from '../../../../layout/placement.ts';
import type { Project } from '../../../../project/project.ts';
import type { Violation } from '../../../../violations/violation.ts';
import { FitnessFunction } from '../../../fitness-function.ts';
import { Rule } from '../../../rule.ts';

export class Lay04 extends FitnessFunction {
	public readonly rule: Rule = new Rule(
		'LAY-04',
		'Un autre bounded context n’entre que par `public`, qui ne contient que le contrat',
		'https://alveolus.dev/rules/architecture-and-placement/layers/lay-04',
		['tactical', 'transaction-script'],
		{
			coverage: 'partial',
			checks: 'Imports of another bounded context outside its public folder: static, type-only, re-exported or dynamic with a literal path.',
		},
	);

	public check(project: Project): Violation[] {
		const violations: Violation[] = [];

		for (const file of project.files) {
			const source = project.placementOf(file.path);

			if (source === undefined) {
				continue;
			}

			for (const dependency of file.dependencies) {
				if (dependency.target === undefined) {
					continue;
				}

				const target = project.placementOf(dependency.target);

				if (target !== undefined && this.reachesInside(source, target)) {
					const message = `imports ${dependency.target}, outside ${target.context.publicFolder()}`;
					violations.push(this.violation(file.path, dependency.line, message));
				}
			}
		}

		return violations;
	}

	private reachesInside(source: Placement, target: Placement): boolean {
		return target.isInAnotherContextThan(source) && !target.isPublic() && !target.context.isBigBallOfMud();
	}
}
