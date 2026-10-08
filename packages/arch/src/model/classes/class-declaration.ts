import type { ClassType } from "./class-type.ts";
import type { Heritage, TypeArgument } from "./heritage.ts";
import type { Member } from "./member.ts";
import type { NamedType } from "./named-type.ts";

export interface ClassDeclarationProps {
	readonly name: string;
	readonly line: number;
	readonly isAbstract: boolean;
	readonly type: ClassType;
	readonly heritage: Heritage | undefined;
	readonly implemented: readonly NamedType[];
	readonly members: readonly Member[];
}

export class ClassDeclaration {
	public readonly name: string;
	public readonly line: number;
	public readonly isAbstract: boolean;
	/** The class as a type, with its lineage. */
	public readonly type: ClassType;
	public readonly heritage: Heritage | undefined;
	/** The types of its `implements` clause. */
	public readonly implemented: readonly NamedType[];
	public readonly members: readonly Member[];

	public constructor(props: ClassDeclarationProps) {
		this.name = props.name;
		this.line = props.line;
		this.isAbstract = props.isAbstract;
		this.type = props.type;
		this.heritage = props.heritage;
		this.implemented = props.implemented;
		this.members = props.members;
	}

	/** What the class holds: its fields and its constructor parameters, a parameter property once. */
	public get heldMembers(): Member[] {
		return this.members.filter((member) => member.kind === "field" || member.kind === "constructor parameter");
	}

	/** The public members other code sees on an instance: methods, fields and getters, constructor parameters that declare a field. */
	public get publicSurface(): Member[] {
		return this.members.filter((member) => member.isPublicInstance && member.kind !== "setter" && this.isDeclared(member));
	}

	public get typeArguments(): readonly TypeArgument[] {
		return this.heritage?.typeArguments ?? [];
	}

	public get extendsByName(): boolean {
		return this.heritage === undefined || this.heritage.isByName;
	}

	/** Every member is static: a bag of functions. A class without members is not. */
	public get isStaticOnly(): boolean {
		const members = this.members.filter((member) => this.isDeclared(member));
		return members.length > 0 && members.every((member) => member.isStatic);
	}

	/** A member of the class itself: a constructor parameter counts only when it declares a field. */
	private isDeclared(member: Member): boolean {
		return member.kind !== "constructor parameter" || member.isParameterProperty;
	}
}
