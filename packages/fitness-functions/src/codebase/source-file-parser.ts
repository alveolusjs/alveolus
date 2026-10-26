import { readFileSync } from 'node:fs';
import { type EcmaScriptModule, parseSync } from 'oxc-parser';

import { Dependency } from './dependency.ts';
import { ModuleRequest } from './module-request.ts';
import type { ModuleResolver } from './module-resolver.ts';
import type { ProjectRoot } from './project-root.ts';
import { SourceFile } from './source-file.ts';

const literalSpecifier = /^(['"`])([^'"`$]*)\1$/;

export class SourceFileParser {
	public constructor(
		private readonly root: ProjectRoot,
		private readonly resolver: ModuleResolver,
	) {}

	public parse(path: string): SourceFile {
		const file = this.root.absolute(path);
		const text = readFileSync(file, 'utf8');
		const module = parseSync(file, text).module;
		const dependencies: Dependency[] = [];

		for (const request of this.requests(module, text)) {
			const target = this.resolver.resolve(file, request.specifier);
			dependencies.push(new Dependency(request.specifier, target, this.lineAt(text, request.offset)));
		}

		return new SourceFile(this.root.relative(file), dependencies);
	}

	private requests(module: EcmaScriptModule, text: string): ModuleRequest[] {
		const requests: ModuleRequest[] = [];

		for (const statement of module.staticImports) {
			requests.push(new ModuleRequest(statement.moduleRequest.value, statement.start));
		}

		for (const statement of module.staticExports) {
			const source = statement.entries[0]?.moduleRequest;

			if (source) {
				requests.push(new ModuleRequest(source.value, statement.start));
			}
		}

		for (const call of module.dynamicImports) {
			const argument = text.slice(call.moduleRequest.start, call.moduleRequest.end);
			const specifier = literalSpecifier.exec(argument)?.[2];

			if (specifier !== undefined) {
				requests.push(new ModuleRequest(specifier, call.start));
			}
		}

		return requests;
	}

	private lineAt(text: string, offset: number): number {
		let line = 1;

		for (let index = 0; index < offset; index++) {
			if (text[index] === '\n') {
				line++;
			}
		}

		return line;
	}
}
