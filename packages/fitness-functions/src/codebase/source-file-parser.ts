import { readFileSync } from 'node:fs';
import { type EcmaScriptModule, parseSync } from 'oxc-parser';

import { Comment } from './comment.ts';
import { Dependency } from './dependency.ts';
import { Lines } from './lines.ts';
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
		const parsed = parseSync(file, text);
		const lines = new Lines(text);
		const dependencies: Dependency[] = [];
		const comments: Comment[] = [];

		for (const request of this.requests(parsed.module, text)) {
			const target = this.resolver.resolve(file, request.specifier);
			dependencies.push(new Dependency(request.specifier, target, lines.at(request.offset)));
		}

		for (const comment of parsed.comments) {
			comments.push(new Comment(comment.value.trim(), lines.at(comment.start)));
		}

		return new SourceFile(this.root.relative(file), dependencies, comments);
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
}
