import type { ClassDeclaration } from "./classes/class-declaration.ts";
import type { Dependency } from "./dependencies/dependency.ts";
import type { GlobalUse } from "./dependencies/global-use.ts";
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
}

/** What a file of the project contains, as facts: no convention of Alveolus applies here. */
export class SourceFile {
	public readonly path: string;
	public readonly dependencies: readonly Dependency[];
	public readonly classes: readonly ClassDeclaration[];
	/** The top-level statements that are no import, export, class, type or constant of data. */
	public readonly statements: readonly TopLevelStatement[];
	public readonly throws: readonly Throw[];
	public readonly globals: readonly GlobalUse[];
	private readonly lines: readonly string[];

	public constructor(props: SourceFileProps) {
		this.path = props.path;
		this.dependencies = props.dependencies;
		this.classes = props.classes;
		this.statements = props.statements;
		this.throws = props.throws;
		this.globals = props.globals;
		this.lines = props.text.split(/\r?\n/);
	}

	/** The text of a line, counted from 1. */
	public lineText(line: number): string {
		return this.lines[line - 1] ?? "";
	}

	public classNamed(name: string): ClassDeclaration | undefined {
		return this.classes.find((candidate) => candidate.name === name);
	}
}
