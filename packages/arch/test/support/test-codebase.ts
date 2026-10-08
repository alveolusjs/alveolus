import { ModuleKind, ModuleResolutionKind, Project, ScriptTarget } from "ts-morph";

import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { Architecture } from "../../src/architecture/index.ts";
import type { Violation } from "../../src/check/index.ts";
import { Checker } from "../../src/check/index.ts";
import type { AlveolusConfig } from "../../src/config/index.ts";
import { Config } from "../../src/config/index.ts";
import { TsMorphImporter } from "../../src/importer/index.ts";
import type { Project as ReadProject, SourceFile } from "../../src/model/index.ts";
import type { Rule, RuleId } from "../../src/rules/index.ts";
import { RuleRegistry } from "../../src/rules/index.ts";

const coreDir = fileURLToPath(new URL("../../../core", import.meta.url));
const installedCoreDir = "/node_modules/@alveolus/core";
const projectDir = "/project";

export class TestCodebase {
	public readonly config: Config;
	private readonly project: Project;

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
		this.project.createSourceFile(join(projectDir, path), content, { overwrite: true });
		return this;
	}

	public get importer(): TsMorphImporter {
		return new TsMorphImporter(this.project);
	}

	public read(): ReadProject {
		return new TsMorphImporter(this.project).read(this.config);
	}

	public readFile(path: string): SourceFile {
		const file = this.read().file(join(projectDir, path));
		if (file === undefined) {
			throw new Error(`${path} is not an analysed file of the project.`);
		}
		return file;
	}

	public architecture(): Architecture {
		return new Architecture(this.read(), this.config);
	}

	public check(rule: Rule<RuleId>): string[] {
		return this.run(rule).map((violation) => this.format(violation));
	}

	public messages(rule: Rule<RuleId>): string[] {
		return this.run(rule).map((violation) => violation.message);
	}

	public checkAllRules(): string[] {
		const checker = new Checker(new TsMorphImporter(this.project), new RuleRegistry().rules);
		return checker.check(this.config).violations.map((violation) => this.format(violation));
	}

	private run(rule: Rule<RuleId>): Violation[] {
		return new Checker(new TsMorphImporter(this.project), [rule]).run(rule, this.architecture());
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
