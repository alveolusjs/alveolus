import { ResolverFactory } from 'oxc-resolver';

import type { ProjectRoot } from './project-root.ts';

export class ModuleResolver {
	private readonly factory: ResolverFactory = new ResolverFactory({
		conditionNames: ['types', 'import', 'node', 'default'],
		extensionAlias: { '.js': ['.ts', '.tsx', '.js'] },
		extensions: ['.ts', '.tsx', '.d.ts', '.js', '.json'],
		tsconfig: 'auto',
	});

	public constructor(private readonly root: ProjectRoot) {}

	public resolve(file: string, specifier: string): string | undefined {
		const resolved = this.factory.resolveFileSync(file, specifier).path ?? this.declarationOf(file, specifier);

		if (resolved === undefined) {
			return undefined;
		}

		return this.root.relative(resolved);
	}

	private declarationOf(file: string, specifier: string): string | undefined {
		return this.factory.resolveDtsSync(file, specifier).path;
	}
}
