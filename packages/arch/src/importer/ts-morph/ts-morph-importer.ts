import { Project as MorphProject, ts } from "ts-morph";
import type { SourceFile as MorphFile } from "ts-morph";

import { existsSync } from "node:fs";
import { isAbsolute, join, normalize, relative } from "node:path";

import { GlobalUse, Project, SourceFile } from "../../model/index.ts";
import type { ImportScope } from "../importer.ts";
import { Importer } from "../importer.ts";
import { PackageNames } from "./package-names.ts";
import { ClassReader } from "./readers/class-reader.ts";
import { DependencyReader } from "./readers/dependency-reader.ts";
import { DisableReader } from "./readers/disable-reader.ts";
import { GlobalChannelReader } from "./readers/global-channel-reader.ts";
import { GlobalReader } from "./readers/global-reader.ts";
import type { GlobalReference } from "./readers/global-reference.ts";
import { ModuleReachReader } from "./readers/module-reach-reader.ts";
import { StatementReader } from "./readers/statement-reader.ts";
import { ThrowReader } from "./readers/throw-reader.ts";
import { TypeReader } from "./readers/type-reader.ts";
import { WiringReader } from "./readers/wiring-reader.ts";

interface FileReaders {
	readonly dependencies: DependencyReader;
	readonly globals: GlobalReader;
	readonly wirings: WiringReader;
	readonly reaches: ModuleReachReader;
}

export class TsMorphImporter extends Importer {
	private readonly classes: ClassReader;
	private readonly types: TypeReader;
	private readonly statements = new StatementReader();
	private readonly disables = new DisableReader();
	private readonly throws = new ThrowReader();
	private readonly globalChannels = new GlobalChannelReader();

	public constructor(private readonly sources: MorphProject) {
		super();
		this.types = new TypeReader(new PackageNames(sources.getFileSystem()));
		this.classes = new ClassReader(this.types);
	}

	public static fromTsConfig(tsConfigFilePath: string): TsMorphImporter {
		if (!existsSync(tsConfigFilePath)) {
			throw new Error(`No TypeScript configuration found at ${tsConfigFilePath}: pass --tsconfig, or set tsconfig in alveolus.config.ts.`);
		}
		return new TsMorphImporter(new MorphProject({ tsConfigFilePath }));
	}

	public resolves(packageName: string, scope: ImportScope): boolean {
		const from = join(scope.rootDir, "index.ts");
		const resolution = ts.resolveModuleName(packageName, from, this.sources.getCompilerOptions(), this.sources.getModuleResolutionHost());
		return resolution.resolvedModule !== undefined;
	}

	public read(scope: ImportScope): Project {
		const dependencies = new DependencyReader(this.sources, scope);
		const wirings = new WiringReader(this.types, scope);
		const reaches = new ModuleReachReader(this.types, scope);
		const globals = new GlobalReader(scope.projectDir);
		const files: SourceFile[] = [];
		for (const file of this.sources.getSourceFiles()) {
			if (this.isInside(scope.rootDir, file.getFilePath()) && !scope.isIgnored(file.getFilePath())) {
				files.push(this.readFile(file, { dependencies, globals, reaches, wirings }));
			}
		}
		return new Project(scope.projectDir, files);
	}

	private readFile(file: MorphFile, readers: FileReaders): SourceFile {
		const { dependencies, globals, reaches, wirings } = readers;
		const globalReferences = globals.read(file);
		return new SourceFile({
			classes: file.getClasses().map((declaration) => this.classes.read(declaration)),
			dependencies: dependencies.read(file, globalReferences),
			disables: this.disables.read(file),
			globalChannels: this.globalChannels.read(file),
			globals: this.globalUsesOf(globalReferences),
			moduleReaches: reaches.read(file),
			path: normalize(file.getFilePath()),
			statements: this.statements.read(file),
			text: file.getFullText(),
			throws: this.throws.read(file),
			wirings: wirings.read(file),
		});
	}

	private globalUsesOf(references: readonly GlobalReference[]): GlobalUse[] {
		const uses: GlobalUse[] = [];
		for (const reference of references) {
			if (reference.origin !== "project") {
				uses.push(new GlobalUse(reference.line, reference.name, reference.origin, reference.effect));
			}
		}
		return uses;
	}

	private isInside(directory: string, path: string): boolean {
		const offset = relative(directory, path);
		return offset !== "" && !offset.startsWith("..") && !isAbsolute(offset) && !offset.split(/[\\/]/).includes("node_modules");
	}
}
