export type Upstreams = Readonly<Record<string, readonly string[]>>;

export class ContextMap {
	public constructor(private readonly upstreams: Upstreams) {}

	public get contexts(): string[] {
		return Object.keys(this.upstreams);
	}

	public get consumed(): string[] {
		const names = new Set<string>();
		for (const targets of Object.values(this.upstreams)) {
			for (const target of targets) {
				names.add(target);
			}
		}
		return [...names];
	}

	public selfConsumers(): string[] {
		return this.contexts.filter((context) => this.allows(context, context));
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
}
