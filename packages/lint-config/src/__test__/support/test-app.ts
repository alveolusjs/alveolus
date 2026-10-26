import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { referenceApp } from './reference-app.ts';

const packageRoot = fileURLToPath(new URL('../../../', import.meta.url));
const oxlintBin = join(packageRoot, 'node_modules/oxlint/bin/oxlint');
const depcruiseBin = join(packageRoot, 'node_modules/dependency-cruiser/bin/dependency-cruiser.mjs');
const oxlintPreset = pathToFileURL(join(packageRoot, 'src/oxlint.ts')).href;
const dependencyCruiserPreset = join(packageRoot, 'src/dependency-cruiser.ts');

const restrictedImports = 'eslint(no-restricted-imports)';

type OxlintDiagnostic = {
	readonly code: string;
	readonly filename: string;
	readonly help: string;
	readonly labels: readonly { readonly span: { readonly line: number } }[];
};

type DependencyCruiserViolation = {
	readonly from: string;
	readonly to: string;
	readonly rule: { readonly name: string };
};

type OxlintReport = {
	readonly diagnostics: readonly OxlintDiagnostic[];
};

type DependencyCruiserReport = {
	readonly summary: { readonly violations: readonly DependencyCruiserViolation[] };
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

	public oxlint(): string[] {
		const output = this.#run(oxlintBin, ['--format', 'json']);
		const { diagnostics }: OxlintReport = JSON.parse(output);
		const findings: string[] = [];

		for (const diagnostic of diagnostics) {
			if (diagnostic.code !== restrictedImports) {
				continue;
			}

			findings.push(
				`${diagnostic.filename.replaceAll('\\', '/')}:${diagnostic.labels[0]?.span.line} ${diagnostic.help}`,
			);
		}

		return findings.sort();
	}

	public dependencyCruiser(): string[] {
		const output = this.#run(depcruiseBin, ['src', '--output-type', 'json']);
		const { summary }: DependencyCruiserReport = JSON.parse(output);
		const findings: string[] = [];

		for (const violation of summary.violations) {
			findings.push(`${violation.rule.name} ${violation.from} → ${violation.to}`);
		}

		return findings.sort();
	}

	#run(bin: string, args: readonly string[]): string {
		const directory = mkdtempSync(join(tmpdir(), 'alveolus-lint-'));

		try {
			this.#write(directory);

			return spawnSync(process.execPath, [bin, ...args], { cwd: directory, encoding: 'utf8' }).stdout;
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	}

	#write(directory: string): void {
		const files = {
			...this.#files,
			'oxlint.config.mts': `import alveolus from '${oxlintPreset}';\n\nexport default { extends: [alveolus] };\n`,
			'.dependency-cruiser.cjs': `module.exports = { extends: ${JSON.stringify(dependencyCruiserPreset)} };\n`,
		};

		for (const [path, text] of Object.entries(files)) {
			mkdirSync(dirname(join(directory, path)), { recursive: true });
			writeFileSync(join(directory, path), text);
		}
	}
}
