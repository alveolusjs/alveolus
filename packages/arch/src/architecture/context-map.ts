export type Upstreams = Readonly<Record<string, readonly string[]>>;

export class ContextMap {
	public constructor(private readonly upstreams: Upstreams) {}

	public static ofEdges(edges: readonly { readonly from: string; readonly to: string }[]): ContextMap {
		const upstreams: Record<string, string[]> = {};
		for (const { from, to } of edges) {
			const known = upstreams[from] ?? [];
			if (!known.includes(to)) {
				upstreams[from] = [...known, to];
			}
		}
		return new ContextMap(upstreams);
	}

	public get contexts(): string[] {
		const names = new Set(Object.keys(this.upstreams));
		for (const targets of Object.values(this.upstreams)) {
			for (const target of targets) {
				names.add(target);
			}
		}
		return [...names];
	}

	public allows(from: string, to: string): boolean {
		return (this.upstreams[from] ?? []).includes(to);
	}

	public cycle(): string[] | undefined {
		const visiting = new Set<string>();
		const done = new Set<string>();
		for (const start of this.contexts) {
			const found = this.cycleFrom(start, [], visiting, done);
			if (found !== undefined) {
				return found;
			}
		}
		return undefined;
	}

	public cycleThrough(from: string, to: string): boolean {
		return this.reaches(to, from, new Set());
	}

	private cycleFrom(context: string, path: string[], visiting: Set<string>, done: Set<string>): string[] | undefined {
		if (done.has(context)) {
			return undefined;
		}
		if (visiting.has(context)) {
			return [...path.slice(path.indexOf(context)), context];
		}
		visiting.add(context);
		for (const upstream of this.upstreams[context] ?? []) {
			const found = this.cycleFrom(upstream, [...path, context], visiting, done);
			if (found !== undefined) {
				return found;
			}
		}
		visiting.delete(context);
		done.add(context);
		return undefined;
	}

	private reaches(from: string, target: string, seen: Set<string>): boolean {
		if (from === target) {
			return true;
		}
		if (seen.has(from)) {
			return false;
		}
		seen.add(from);
		return (this.upstreams[from] ?? []).some((upstream) => this.reaches(upstream, target, seen));
	}
}
