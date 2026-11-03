import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

export type CheckOutcome = {
	readonly passed: boolean;
	readonly problems: number;
	readonly output: string;
};

export class DesignCheckRun {
	readonly #packageDir: string;

	public constructor(packageDir: string) {
		this.#packageDir = packageDir;
	}

	public check(design: string): CheckOutcome {
		const run = spawnSync(
			'node',
			[join(this.#packageDir, 'bin', 'alveolus-claude.js'), 'design', 'check', design],
			{
				encoding: 'utf8',
			},
		);
		const output = `${run.stdout}${run.stderr}`;
		const problems = Number(/: (\d+) problems?$/m.exec(output)?.[1] ?? 0);

		return { passed: run.status === 0, problems, output };
	}
}
