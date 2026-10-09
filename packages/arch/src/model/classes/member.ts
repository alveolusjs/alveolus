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
	readonly isReadonly: boolean;
	readonly isParameterProperty: boolean;
	readonly isCallable: boolean;
	readonly valueTypes: readonly ClassType[];
	readonly parameterTypes: readonly ClassType[];
	readonly returns: ReturnShape | undefined;
	readonly holdsCollection: boolean;
	readonly receivesFunction: boolean;
	readonly erasedType: string | undefined;
	readonly opaqueValue: string | undefined;
}

export class Member {
	public readonly name: string;
	public readonly line: number;
	public readonly kind: MemberKind;
	public readonly visibility: Visibility;
	public readonly isStatic: boolean;
	public readonly isReadonly: boolean;
	public readonly isParameterProperty: boolean;
	public readonly isCallable: boolean;
	public readonly valueTypes: readonly ClassType[];
	public readonly parameterTypes: readonly ClassType[];
	public readonly returns: ReturnShape | undefined;
	public readonly holdsCollection: boolean;
	public readonly receivesFunction: boolean;
	public readonly erasedType: string | undefined;
	public readonly opaqueValue: string | undefined;

	public constructor(props: MemberProps) {
		this.name = props.name;
		this.line = props.line;
		this.kind = props.kind;
		this.visibility = props.visibility;
		this.isStatic = props.isStatic;
		this.isReadonly = props.isReadonly;
		this.isParameterProperty = props.isParameterProperty;
		this.isCallable = props.isCallable;
		this.valueTypes = props.valueTypes;
		this.parameterTypes = props.parameterTypes;
		this.returns = props.returns;
		this.holdsCollection = props.holdsCollection;
		this.receivesFunction = props.receivesFunction;
		this.erasedType = props.erasedType;
		this.opaqueValue = props.opaqueValue;
	}

	public get isPublicInstance(): boolean {
		return this.visibility === "public" && !this.isStatic;
	}

	public get isField(): boolean {
		return this.kind === "field" || this.isParameterProperty;
	}
}
