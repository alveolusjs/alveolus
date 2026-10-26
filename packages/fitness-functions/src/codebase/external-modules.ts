import { isBuiltin } from 'node:module';

import type { ProjectRoot } from './project-root.ts';

const dependencyFields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

export class ExternalModules {
	private constructor(private readonly packages: ReadonlySet<string>) {}

	public static of(root: ProjectRoot): ExternalModules {
		const text = root.read('package.json');
		const packages = new Set<string>();

		if (text === undefined) {
			return new ExternalModules(packages);
		}

		const manifest: unknown = JSON.parse(text);

		for (const field of dependencyFields) {
			const declared: unknown =
				typeof manifest === 'object' && manifest !== null && field in manifest
					? Reflect.get(manifest, field)
					: {};

			if (typeof declared === 'object' && declared !== null) {
				for (const name of Object.keys(declared)) {
					packages.add(name);
				}
			}
		}

		return new ExternalModules(packages);
	}

	public includes(specifier: string): boolean {
		return isBuiltin(specifier) || this.packages.has(this.packageOf(specifier));
	}

	private packageOf(specifier: string): string {
		const segments = specifier.split('/');

		if (specifier.startsWith('@')) {
			return segments.slice(0, 2).join('/');
		}

		return segments[0] ?? specifier;
	}
}
