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
const dependencyCruiserPreset = join(packageRoot, 'src/dependency-cruiser.ts');
const dependencyCruiserReporter = pathToFileURL(join(packageRoot, 'src/dependency-cruiser-reporter.ts')).href;

const alveolusMessage = /[A-Z]{2,3}-\d{2} · .*$/s;

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

	private constructor(files: Readonly<Record<string, string>>) {
		this.#files = files;
	}

	public static reference(): TestApp {
		return new TestApp(referenceApp);
	}

	public with(path: string, text: string): TestApp {
		return new TestApp({ ...this.#files, [path]: text });
	}

	public eslint(): string[] {
		const findings: string[] = [];

		this.#inDirectory((directory) => {
			const { output } = this.#spawn(directory, eslintBin, ['src', '--format', 'json']);
			const results: readonly EslintResult[] = JSON.parse(output);

			for (const result of results) {
				const path = relative(directory, result.filePath).replaceAll('\\', '/');

				for (const { message, line } of result.messages) {
					findings.push(`${path}:${line} ${alveolusMessage.exec(message)?.[0] ?? message}`);
				}
			}
		});

		return findings.sort();
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
			'eslint.config.mjs': `import alveolus from '${eslintPreset}';\n\nexport default alveolus;\n`,
			'.dependency-cruiser.cjs': `module.exports = { extends: ${JSON.stringify(dependencyCruiserPreset)} };\n`,
		};

		for (const [path, text] of Object.entries(files)) {
			mkdirSync(dirname(join(directory, path)), { recursive: true });
			writeFileSync(join(directory, path), text);
		}
	}
}
