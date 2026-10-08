import type { CodeClass } from "./code-class.ts";
import type { Declaration } from "./declaration.ts";
import type { GlobalUse } from "./global-use.ts";
import type { Import } from "./import.ts";
import type { Location } from "./location.ts";
import type { Throw } from "./throw.ts";

export interface CodeFileProps {
	readonly path: string;
	readonly location: Location;
	readonly imports: readonly Import[];
	readonly classes: readonly CodeClass[];
	readonly declarations: readonly Declaration[];
	readonly throws: readonly Throw[];
	readonly globals: readonly GlobalUse[];
	readonly lines: readonly string[];
}

export class CodeFile {
	public readonly path: string;
	public readonly location: Location;
	public readonly imports: readonly Import[];
	public readonly classes: readonly CodeClass[];
	public readonly declarations: readonly Declaration[];
	public readonly throws: readonly Throw[];
	/** The globals the file uses that are declared outside the project; those of the project are read as imports. */
	public readonly globals: readonly GlobalUse[];
	private readonly lines: readonly string[];

	public constructor(props: CodeFileProps) {
		this.path = props.path;
		this.location = props.location;
		this.imports = props.imports;
		this.classes = props.classes;
		this.declarations = props.declarations;
		this.throws = props.throws;
		this.globals = props.globals;
		this.lines = props.lines;
	}

	/** The text of a line, counted from 1 as violations are. */
	public lineText(line: number): string {
		return this.lines[line - 1] ?? "";
	}

	public declaresOpenHostService(name: string): boolean {
		return this.classes.some((codeClass) => codeClass.name === name && codeClass.implements("OpenHostService"));
	}

	public get declaresAntiCorruptionLayer(): boolean {
		return this.classes.some((codeClass) => codeClass.implements("AntiCorruptionLayer"));
	}
}
