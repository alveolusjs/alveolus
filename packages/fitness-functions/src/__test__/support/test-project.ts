import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { FitnessFunctions } from '../../fitness-functions.ts';
import type { RuleCode } from '../../rules/rule-code.ts';
import type { Violation } from '../../violations/violation.ts';
import { referenceApp } from './reference-app.ts';

export class TestProject {
	private constructor(private readonly files: Readonly<Record<string, string>>) {}

	public static app(): TestProject {
		return new TestProject(referenceApp);
	}

	public with(path: string, text: string): TestProject {
		return new TestProject({ ...this.files, [path]: text });
	}

	public without(path: string): TestProject {
		const files: Record<string, string> = {};

		for (const [name, text] of Object.entries(this.files)) {
			if (name !== path) {
				files[name] = text;
			}
		}

		return new TestProject(files);
	}

	public check(code: RuleCode): Violation[] {
		return this.fitness().check(code);
	}

	public fitness(): FitnessFunctions {
		const directory = mkdtempSync(join(tmpdir(), 'alveolus-fitness-'));

		try {
			for (const [path, text] of Object.entries(this.files)) {
				mkdirSync(dirname(join(directory, path)), { recursive: true });
				writeFileSync(join(directory, path), text);
			}

			return FitnessFunctions.of(directory);
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	}
}
