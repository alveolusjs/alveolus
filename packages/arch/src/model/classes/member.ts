import type { ClassType } from "./class-type.ts";
import type { ReturnShape } from "./return-shape.ts";

export type MemberKind = "field" | "constructor parameter" | "method" | "getter" | "setter";

export type Visibility = "public" | "protected" | "private";

export interface MemberProps {
	readonly name: string;
	readonly line: number;
	readonly kind: MemberKind;
	readonly visibility: Visibility;
	readonly isStatic: boolean;
	readonly isParameterProperty: boolean;
	readonly isCallable: boolean;
	readonly valueTypes: readonly ClassType[];
	readonly parameterTypes: readonly ClassType[];
	readonly returns: ReturnShape | undefined;
}

/** A member of a class, with the classes its type mentions. */
export class Member {
	public readonly name: string;
	public readonly line: number;
	public readonly kind: MemberKind;
	public readonly visibility: Visibility;
	public readonly isStatic: boolean;
	/** A constructor parameter declared `private readonly x`: a field too. */
	public readonly isParameterProperty: boolean;
	/** A field that holds a function, such as `place = () => …`. */
	public readonly isCallable: boolean;
	/**
	 * The classes its value holds, followed in depth through generics, tuples and object types: the type of a field or a parameter,
	 * what a method or a getter returns. The parameters of a callback are not followed: receiving a value is not holding it.
	 */
	public readonly valueTypes: readonly ClassType[];
	/** The classes in the parameters of a method. */
	public readonly parameterTypes: readonly ClassType[];
	/** How the result of a method, a getter or a callable field is spelled. */
	public readonly returns: ReturnShape | undefined;

	public constructor(props: MemberProps) {
		this.name = props.name;
		this.line = props.line;
		this.kind = props.kind;
		this.visibility = props.visibility;
		this.isStatic = props.isStatic;
		this.isParameterProperty = props.isParameterProperty;
		this.isCallable = props.isCallable;
		this.valueTypes = props.valueTypes;
		this.parameterTypes = props.parameterTypes;
		this.returns = props.returns;
	}

	public get isPublicInstance(): boolean {
		return this.visibility === "public" && !this.isStatic;
	}

	/** A field, or a constructor parameter that declares one. */
	public get isField(): boolean {
		return this.kind === "field" || this.isParameterProperty;
	}
}
