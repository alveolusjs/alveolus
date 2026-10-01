import type { CodeClass } from "./code-class.ts";
import type { Declaration } from "./declaration.ts";
import type { Import } from "./import.ts";
import type { Location } from "./location.ts";

export interface CodeFileProps {
	readonly path: string;
	readonly location: Location;
	readonly imports: readonly Import[];
	readonly classes: readonly CodeClass[];
	readonly declarations: readonly Declaration[];
	readonly domainErrorThrows: readonly number[];
}

export class CodeFile {
	public readonly path: string;
	public readonly location: Location;
	public readonly imports: readonly Import[];
	public readonly classes: readonly CodeClass[];
	public readonly declarations: readonly Declaration[];
	public readonly domainErrorThrows: readonly number[];

	public constructor(props: CodeFileProps) {
		this.path = props.path;
		this.location = props.location;
		this.imports = props.imports;
		this.classes = props.classes;
		this.declarations = props.declarations;
		this.domainErrorThrows = props.domainErrorThrows;
	}

	public declaresOpenHostService(name: string): boolean {
		return this.classes.some((codeClass) => codeClass.name === name && codeClass.implements("OpenHostService"));
	}

	public get declaresAntiCorruptionLayer(): boolean {
		return this.classes.some((codeClass) => codeClass.implements("AntiCorruptionLayer"));
	}
}
