import { existsSync, readFileSync } from 'node:fs';

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
