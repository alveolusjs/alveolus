import { relative } from 'node:path';

import ts from 'typescript';

export class ModuleTargets {
	readonly #program: ts.Program;
	readonly #cwd: string;

	public constructor(program: ts.Program, cwd: string) {
		this.#program = program;
		this.#cwd = cwd;
	}

	public static isProgram(value: unknown): value is ts.Program {
		return typeof value === 'object' && value !== null && 'getCompilerOptions' in value;
	}

	public path(file: string): string {
		return relative(this.#cwd, file).replaceAll('\\', '/');
	}

	public resolve(specifier: string, from: string): string | undefined {
		const { resolvedModule } = ts.resolveModuleName(specifier, from, this.#program.getCompilerOptions(), ts.sys);

		if (resolvedModule === undefined || resolvedModule.isExternalLibraryImport === true) {
			return undefined;
		}

		return this.path(resolvedModule.resolvedFileName);
	}
}
