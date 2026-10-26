import type { ProjectRoot } from '../codebase/project-root.ts';
import { Architecture, sharedFolder, sourceFolder } from './architecture.ts';
import { BoundedContext } from './bounded-context.ts';
import type { ContextStyle } from './style.ts';

const file = 'architecture.json';
const declarations: readonly ContextStyle[] = ['tactical', 'transaction-script', 'big-ball-of-mud'];
const declareEachContext = 'declare each bounded context and its style, as CTX-14 says.';

export class ArchitectureReader {
	public constructor(private readonly root: ProjectRoot) {}

	public read(): Architecture {
		const text = this.root.read(file);

		if (text === undefined) {
			throw new Error(`${file} not found: ${declareEachContext}`);
		}

		const contexts = this.contexts(this.parse(text));
		this.checkUndeclaredFolders(contexts);

		return new Architecture(contexts);
	}

	private parse(text: string): unknown {
		try {
			return JSON.parse(text);
		} catch (error) {
			throw new Error(`${file} is not valid JSON: ${String(error)}`);
		}
	}

	private contexts(json: unknown): BoundedContext[] {
		const declared = typeof json === 'object' && json !== null && 'contexts' in json ? json.contexts : undefined;

		if (typeof declared !== 'object' || declared === null || Object.keys(declared).length === 0) {
			throw new Error(`${file}: "contexts" must map each bounded context to its style.`);
		}

		const contexts: BoundedContext[] = [];

		for (const [name, declaration] of Object.entries(declared)) {
			contexts.push(this.context(name, declaration));
		}

		return contexts;
	}

	private context(name: string, declaration: unknown): BoundedContext {
		const longForm = typeof declaration === 'object' && declaration !== null;
		const declaredStyle = longForm && 'style' in declaration ? declaration.style : declaration;
		const declaredPath = longForm && 'path' in declaration ? declaration.path : `${sourceFolder}/${name}`;
		const style = declarations.find((candidate) => candidate === declaredStyle);

		if (style === undefined) {
			const expected = declarations.join(', ');
			throw new Error(`${file}: ${name} has style "${String(declaredStyle)}", expected one of ${expected}.`);
		}

		if (typeof declaredPath !== 'string' || declaredPath.trim() === '') {
			throw new Error(`${file}: ${name} has a "path" that is not a folder.`);
		}

		const path = declaredPath.replace(/\/+$/, '');

		if (!this.root.contains(path)) {
			throw new Error(`${file}: ${name} has a "path" outside the project: ${path}.`);
		}

		if (!this.root.isFolder(path)) {
			throw new Error(`${file}: ${name} lives in ${path}, which is not a folder.`);
		}

		return new BoundedContext(name, style, path);
	}

	private checkUndeclaredFolders(contexts: readonly BoundedContext[]): void {
		const undeclared: string[] = [];

		for (const folder of this.root.folders(sourceFolder)) {
			const path = `${sourceFolder}/${folder}`;

			if (folder !== sharedFolder && !this.declares(contexts, path)) {
				undeclared.push(path);
			}
		}

		if (undeclared.length > 0) {
			throw new Error(`${file}: ${undeclared.join(', ')} not declared: ${declareEachContext}`);
		}
	}

	private declares(contexts: readonly BoundedContext[], path: string): boolean {
		return contexts.some((context) => context.path === path || context.path.startsWith(`${path}/`));
	}
}
