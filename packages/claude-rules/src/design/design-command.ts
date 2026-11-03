import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { DesignAssembly } from './assembly/design-assembly.ts';
import { DesignCheck } from './design-check.ts';
import { MermaidParser } from './mermaid-parser.ts';
import { RuleCatalog } from './rule-catalog.ts';

export class DesignCommand {
	readonly #rulesFile: string;

	public constructor(rulesFile: string) {
		this.#rulesFile = rulesFile;
	}

	public async check(paths: readonly string[]): Promise<number> {
		const check = new DesignCheck(RuleCatalog.read(this.#rulesFile), await MermaidParser.load());
		let failed = false;

		for (const path of paths) {
			failed = !(await this.#checkFile(check, path)) || failed;
		}

		return failed ? 1 : 0;
	}

	public assemble(workDir: string, output: string, none: string): number {
		if (!existsSync(join(workDir, 'skeleton.md'))) {
			console.error(`${workDir}: no skeleton.md`);

			return 1;
		}

		const { text, warnings } = new DesignAssembly(workDir, none).assemble();

		for (const warning of warnings) {
			console.log(`${workDir}  warning: ${warning}`);
		}

		writeFileSync(output, text);
		console.log(`${output}: assembled from ${workDir}`);

		return 0;
	}

	async #checkFile(check: DesignCheck, path: string): Promise<boolean> {
		if (!existsSync(path)) {
			console.error(`${path}: file not found`);

			return false;
		}

		const { findings, notices } = await check.run(readFileSync(path, 'utf8'));

		for (const finding of findings) {
			console.log(`${path}:${finding.line}  ${finding.message}`);
		}

		for (const notice of notices) {
			console.log(`${path}  note: ${notice}`);
		}

		console.log(
			findings.length === 0
				? `${path}: design check passed`
				: `${path}: ${findings.length} problem${findings.length === 1 ? '' : 's'}`,
		);

		return findings.length === 0;
	}
}
