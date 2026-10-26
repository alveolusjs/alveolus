import { Codebase } from './codebase/codebase.ts';
import { ProjectRoot } from './codebase/project-root.ts';
import type { Architecture } from './layout/architecture.ts';
import { ArchitectureReader } from './layout/architecture-reader.ts';
import { Project } from './project/project.ts';
import type { FitnessFunction } from './rules/fitness-function.ts';
import { registry } from './rules/registry.ts';
import type { Rule } from './rules/rule.ts';
import type { RuleCode } from './rules/rule-code.ts';
import type { Violation } from './violations/violation.ts';

export class FitnessFunctions {
	private readonly functions: ReadonlyMap<RuleCode, FitnessFunction> = new Map(
		registry.map((fitnessFunction) => [fitnessFunction.rule.code, fitnessFunction]),
	);

	private constructor(
		private readonly codebase: Codebase,
		private readonly architecture: Architecture,
	) {}

	public static of(directory: string): FitnessFunctions {
		const root = new ProjectRoot(directory);
		const architecture = new ArchitectureReader(root).read();

		return new FitnessFunctions(Codebase.read(root, architecture.sourceFolders()), architecture);
	}

	public rule(code: RuleCode): Rule {
		return this.fitnessFunction(code).rule;
	}

	public check(code: RuleCode): Violation[] {
		const fitnessFunction = this.fitnessFunction(code);
		const project = Project.seenBy(fitnessFunction.rule.styles, this.codebase, this.architecture);

		return fitnessFunction.check(project);
	}

	private fitnessFunction(code: RuleCode): FitnessFunction {
		const fitnessFunction = this.functions.get(code);

		if (fitnessFunction === undefined) {
			throw new Error(`${code} has no fitness function yet`);
		}

		return fitnessFunction;
	}
}
