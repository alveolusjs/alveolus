/** Each package and what may be imported from it: `true` for everything, or the allowed names. */
export type PackageDependencies = Readonly<Record<string, true | readonly string[]>>;

/** The packages a layer may import, and which of their names. */

export class AllowedPackages {
	public constructor(private readonly packages: PackageDependencies = {}) {}

	public has(packageName: string): boolean {
		return Object.hasOwn(this.packages, packageName);
	}

	public forbiddenNames(packageName: string, names: readonly string[]): readonly string[] {
		const allowed = this.packages[packageName];
		if (allowed === undefined) {
			return names;
		}
		if (allowed === true) {
			return [];
		}
		return names.filter((name) => !allowed.includes(name));
	}

	public allowedNames(packageName: string): readonly string[] {
		const allowed = this.packages[packageName];
		if (allowed === undefined || allowed === true) {
			return [];
		}
		return allowed;
	}

	public with(other: AllowedPackages): AllowedPackages {
		const merged: Record<string, true | readonly string[]> = { ...this.packages };
		for (const [packageName, allowed] of Object.entries(other.packages)) {
			const existing = merged[packageName];
			if (existing === undefined) {
				merged[packageName] = allowed;
			} else if (existing === true || allowed === true) {
				merged[packageName] = true;
			} else {
				merged[packageName] = [...existing, ...allowed];
			}
		}
		return new AllowedPackages(merged);
	}
}
