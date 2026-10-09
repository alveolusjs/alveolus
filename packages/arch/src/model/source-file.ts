import type { ClassDeclaration } from "./classes/class-declaration.ts";
import type { Dependency } from "./dependencies/dependency.ts";
import type { GlobalUse } from "./dependencies/global-use.ts";
import type { Wiring } from "./dependencies/wiring.ts";
import type { DisableComment } from "./statements/disable-comment.ts";
import type { Throw } from "./statements/throw.ts";
import type { TopLevelStatement } from "./statements/top-level-statement.ts";

export interface SourceFileProps {
	readonly path: string;
	readonly text: string;
	readonly dependencies: readonly Dependency[];
	readonly classes: readonly ClassDeclaration[];
	readonly statements: readonly TopLevelStatement[];
	readonly throws: readonly Throw[];
	readonly globals: readonly GlobalUse[];
	readonly wirings: readonly Wiring[];
	readonly disables: readonly DisableComment[];
}

export class SourceFile {
	public readonly path: string;
	public readonly dependencies: readonly Dependency[];
	public readonly classes: readonly ClassDeclaration[];
	public readonly statements: readonly TopLevelStatement[];
	public readonly throws: readonly Throw[];
	public readonly globals: readonly GlobalUse[];
	public readonly wirings: readonly Wiring[];
	public readonly disables: readonly DisableComment[];
	private readonly lines: readonly string[];

	public constructor(props: SourceFileProps) {
		this.path = props.path;
		this.dependencies = props.dependencies;
		this.classes = props.classes;
		this.statements = props.statements;
		this.throws = props.throws;
		this.globals = props.globals;
		this.wirings = props.wirings;
		this.disables = props.disables;
		this.lines = props.text.split(/\r?\n/);
	}

	public lineText(line: number): string {
		return this.lines[line - 1] ?? "";
	}

	public disableAbove(line: number): DisableComment | undefined {
		return this.disables.find((comment) => comment.target === line);
	}

	public classNamed(name: string): ClassDeclaration | undefined {
		return this.classes.find((candidate) => candidate.name === name);
	}
}
