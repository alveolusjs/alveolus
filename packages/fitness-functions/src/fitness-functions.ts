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
import type { WaivedViolation } from './violations/waived-violation.ts';
import type { WaiverReview } from './waivers/waiver-review.ts';
import { Waivers } from './waivers/waivers.ts';

export class FitnessFunctions {
	private readonly functions: ReadonlyMap<RuleCode, FitnessFunction> = new Map(
		registry.map((fitnessFunction) => [fitnessFunction.rule.code, fitnessFunction]),
	);
	private readonly reviews: Map<RuleCode, WaiverReview> = new Map();

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
		return [...this.review(code).remaining];
	}

	public waivers(code: RuleCode): WaivedViolation[] {
		return [...this.review(code).waived];
	}

	private review(code: RuleCode): WaiverReview {
		const known = this.reviews.get(code);

		if (known !== undefined) {
			return known;
		}

		const fitnessFunction = this.fitnessFunction(code);
		const project = Project.seenBy(fitnessFunction.rule.styles, this.codebase, this.architecture);
		const violations = fitnessFunction.check(project);
		const review = Waivers.of(fitnessFunction.rule, project.files).review(violations);
		this.reviews.set(code, review);

		return review;
	}

	private fitnessFunction(code: RuleCode): FitnessFunction {
		const fitnessFunction = this.functions.get(code);

		if (fitnessFunction === undefined) {
			throw new Error(`${code} has no fitness function yet`);
		}

		return fitnessFunction;
	}
}
