import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { referenceApp } from './reference-app.ts';

const packageRoot = fileURLToPath(new URL('../../../', import.meta.url));
const eslintBin = join(packageRoot, 'node_modules/eslint/bin/eslint.js');
const depcruiseBin = join(packageRoot, 'node_modules/dependency-cruiser/bin/dependency-cruiser.mjs');
const eslintPreset = pathToFileURL(join(packageRoot, 'src/eslint.ts')).href;
const eslintFormatter = join(packageRoot, 'src/eslint-formatter.ts');
const dependencyCruiserPreset = join(packageRoot, 'src/dependency-cruiser.ts');
const dependencyCruiserReporter = pathToFileURL(join(packageRoot, 'src/dependency-cruiser-reporter.ts')).href;

type EslintResult = {
	readonly filePath: string;
	readonly messages: readonly { readonly message: string; readonly line: number }[];
};

type DependencyCruiserViolation = {
	readonly from: string;
	readonly to: string;
	readonly rule: { readonly name: string };
};

type DependencyCruiserReport = {
	readonly summary: { readonly violations: readonly DependencyCruiserViolation[] };
};

type Run = {
	readonly output: string;
	readonly status: number | null;
};

export class TestApp {
	readonly #files: Readonly<Record<string, string>>;
	readonly #dependencyCruiserRules: readonly object[];
	readonly #eslintRules: Readonly<Record<string, string>>;

	private constructor(
		files: Readonly<Record<string, string>>,
		dependencyCruiserRules: readonly object[],
		eslintRules: Readonly<Record<string, string>>,
	) {
		this.#files = files;
		this.#dependencyCruiserRules = dependencyCruiserRules;
		this.#eslintRules = eslintRules;
	}

	public static reference(): TestApp {
		return new TestApp(referenceApp, [], {});
	}

	public with(path: string, text: string): TestApp {
		return new TestApp({ ...this.#files, [path]: text }, this.#dependencyCruiserRules, this.#eslintRules);
	}

	public withDependencyCruiserRule(rule: object): TestApp {
		return new TestApp(this.#files, [...this.#dependencyCruiserRules, rule], this.#eslintRules);
	}

	public withEslintRule(name: string): TestApp {
		return new TestApp(this.#files, this.#dependencyCruiserRules, { ...this.#eslintRules, [name]: 'error' });
	}

	public eslint(): string[] {
		return this.eslintMessages().map((finding) => finding.replace(/^(\S+) .*?([A-Z]{2,3}-\d{2} · )/s, '$1 $2'));
	}

	public eslintMessages(): string[] {
		const findings: string[] = [];

		this.#inDirectory((directory) => {
			const { output } = this.#spawn(directory, eslintBin, ['src', '--format', 'json']);
			const results: readonly EslintResult[] = JSON.parse(output);

			for (const result of results) {
				const path = relative(directory, result.filePath).replaceAll('\\', '/');

				for (const { message, line } of result.messages) {
					findings.push(`${path}:${line} ${message}`);
				}
			}
		});

		return findings.sort();
	}

	public eslintReport(): Run {
		let run: Run = { output: '', status: null };

		this.#inDirectory((directory) => {
			run = this.#spawn(directory, eslintBin, ['src', '--format', eslintFormatter]);
		});

		return run;
	}

	public dependencyCruiser(): string[] {
		const findings: string[] = [];

		this.#inDirectory((directory) => {
			const { output } = this.#spawn(directory, depcruiseBin, ['src', '--output-type', 'json']);
			const { summary }: DependencyCruiserReport = JSON.parse(output);

			for (const violation of summary.violations) {
				findings.push(`${violation.rule.name} ${violation.from} → ${violation.to}`);
			}
		});

		return findings.sort();
	}

	public dependencyCruiserReport(): Run {
		let run: Run = { output: '', status: null };

		this.#inDirectory((directory) => {
			run = this.#spawn(directory, depcruiseBin, ['src', '--output-type', `plugin:${dependencyCruiserReporter}`]);
		});

		return run;
	}

	#inDirectory(use: (directory: string) => void): void {
		const directory = realpathSync(mkdtempSync(join(tmpdir(), 'alveolus-lint-')));

		try {
			this.#write(directory);
			use(directory);
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	}

	#spawn(directory: string, bin: string, args: readonly string[]): Run {
		const { stdout, status } = spawnSync(process.execPath, [bin, ...args], { cwd: directory, encoding: 'utf8' });

		return { output: stdout, status };
	}

	#write(directory: string): void {
		const files = {
			...this.#files,
			'eslint.config.mjs': `import alveolus from '${eslintPreset}';\n\nexport default [...alveolus, { files: ['src/**/*.ts'], rules: ${JSON.stringify(this.#eslintRules)} }];\n`,
			'.dependency-cruiser.cjs': `module.exports = { extends: ${JSON.stringify(dependencyCruiserPreset)}, forbidden: ${JSON.stringify(this.#dependencyCruiserRules)} };\n`,
		};

		for (const [path, text] of Object.entries(files)) {
			mkdirSync(dirname(join(directory, path)), { recursive: true });
			writeFileSync(join(directory, path), text);
		}
	}
}
