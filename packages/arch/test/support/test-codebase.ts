import { ModuleKind, ModuleResolutionKind, Project, ScriptTarget } from "ts-morph";

import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { TsMorphAnalyzer } from "../../src/analysis/index.ts";
import { ArchChecker } from "../../src/checker/index.ts";
import type { Codebase } from "../../src/codebase/index.ts";
import type { AlveolusConfig } from "../../src/config/index.ts";
import { Config } from "../../src/config/index.ts";
import type { Rule, Violation } from "../../src/rules/index.ts";
import { Rules } from "../../src/rules/index.ts";

const coreDir = fileURLToPath(new URL("../../../core", import.meta.url));
const installedCoreDir = "/node_modules/@alveolus/core";
const projectDir = "/project";

export class TestCodebase {
	private readonly project: Project;
	private readonly config: Config;

	public constructor(config: Partial<AlveolusConfig> = {}) {
		this.config = new Config({ boundedContexts: { catalog: "catalog", ordering: "ordering" }, root: "src", ...config }, projectDir);
		this.project = new Project({
			compilerOptions: {
				allowImportingTsExtensions: true,
				experimentalDecorators: true,
				module: ModuleKind.ESNext,
				moduleResolution: ModuleResolutionKind.Bundler,
				noEmit: true,
				paths: { "@alveolus/core": [`${installedCoreDir}/src/index.ts`] },
				strict: true,
				target: ScriptTarget.ES2024,
			},
			useInMemoryFileSystem: true,
		});
		this.installCore();
	}

	public file(path: string, content: string): this {
		this.project.createSourceFile(join(projectDir, path), content);
		return this;
	}

	public analyze(): Codebase {
		return new TsMorphAnalyzer(this.project).analyze(this.config);
	}

	public check(rule: Rule): string[] {
		return rule.check(this.analyze()).map((violation) => this.format(violation));
	}

	public messages(rule: Rule): string[] {
		return rule.check(this.analyze()).map((violation) => violation.message);
	}

	public checkAllRules(): string[] {
		const checker = new ArchChecker(new TsMorphAnalyzer(this.project), Rules.all());
		return checker.check(this.config).map((violation) => this.format(violation));
	}

	private format(violation: Violation): string {
		return `${violation.file}:${violation.line} ${violation.symbol}`;
	}

	private installCore(): void {
		this.project.getFileSystem().writeFileSync(`${installedCoreDir}/package.json`, JSON.stringify({ name: "@alveolus/core" }));
		for (const file of globSync("src/**/*.ts", { cwd: coreDir })) {
			if (!file.endsWith(".test.ts")) {
				this.project.createSourceFile(`${installedCoreDir}/${file}`, readFileSync(join(coreDir, file), "utf8"));
			}
		}
	}
}
