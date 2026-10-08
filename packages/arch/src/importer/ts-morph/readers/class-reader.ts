import { Node, Scope } from "ts-morph";
import type { ClassMemberTypes, ConstructorDeclaration, ClassDeclaration as MorphClass, ParameterDeclaration } from "ts-morph";

import type { ClassType, Heritage, ReturnShape, TypeArgument, Visibility } from "../../../model/index.ts";
import { ClassDeclaration, Member } from "../../../model/index.ts";
import type { TypeReader } from "./type-reader.ts";

/** What a member's types say, as far as its kind has any. */
interface MemberTypes {
	readonly isCallable?: boolean;
	readonly parameterTypes?: readonly ClassType[];
	readonly returns?: ReturnShape | undefined;
	readonly valueTypes?: readonly ClassType[];
}

/** Reads a class declaration: its lineage, its `extends` and `implements` clauses, and its members in source order. */
export class ClassReader {
	public constructor(private readonly types: TypeReader) {}

	public read(declaration: MorphClass): ClassDeclaration {
		return new ClassDeclaration({
			heritage: this.heritageOf(declaration),
			implemented: declaration.getImplements().map((clause) => this.types.namedTypeOf(clause.getType())),
			isAbstract: declaration.isAbstract(),
			line: declaration.getStartLineNumber(),
			members: declaration.getMembers().flatMap((member) => this.membersOf(member)),
			name: declaration.getName() ?? "default",
			type: this.types.classTypeOf(declaration.getType()),
		});
	}

	private membersOf(member: ClassMemberTypes): Member[] {
		if (Node.isConstructorDeclaration(member)) {
			return this.constructorParametersOf(member);
		}
		if (Node.isPropertyDeclaration(member)) {
			const type = member.getType();
			const [signature] = type.getCallSignatures();
			return [
				this.member(member, "field", {
					isCallable: signature !== undefined,
					returns: signature === undefined ? undefined : this.types.returnShapeOf(signature.getReturnType()),
					valueTypes: this.types.classTypesIn(type),
				}),
			];
		}
		if (Node.isMethodDeclaration(member)) {
			const returnType = member.getReturnType();
			const parameterTypes = member.getParameters().flatMap((parameter) => this.types.classTypesIn(parameter.getType()));
			return [this.member(member, "method", { parameterTypes, returns: this.types.returnShapeOf(returnType), valueTypes: this.types.classTypesIn(returnType) })];
		}
		if (Node.isGetAccessorDeclaration(member)) {
			const returnType = member.getReturnType();
			return [this.member(member, "getter", { returns: this.types.returnShapeOf(returnType), valueTypes: this.types.classTypesIn(returnType) })];
		}
		if (Node.isSetAccessorDeclaration(member)) {
			return [this.member(member, "setter", {})];
		}
		return [];
	}

	private member(member: Exclude<ClassMemberTypes, ConstructorDeclaration>, kind: Member["kind"], types: MemberTypes): Member {
		const name = Node.hasName(member) ? member.getName() : "";
		const isStatic = Node.isStaticable(member) && member.isStatic();
		const scope = Node.isScoped(member) ? member.getScope() : Scope.Public;
		return new Member({
			isCallable: types.isCallable ?? false,
			isParameterProperty: false,
			isStatic,
			kind,
			line: member.getStartLineNumber(),
			name,
			parameterTypes: types.parameterTypes ?? [],
			returns: types.returns,
			valueTypes: types.valueTypes ?? [],
			visibility: name.startsWith("#") ? "private" : this.visibilityOf(scope),
		});
	}

	private constructorParametersOf(declaration: ConstructorDeclaration): Member[] {
		return declaration.getParameters().map((parameter) => this.constructorParameter(parameter));
	}

	private constructorParameter(parameter: ParameterDeclaration): Member {
		return new Member({
			isCallable: false,
			isParameterProperty: parameter.isParameterProperty(),
			isStatic: false,
			kind: "constructor parameter",
			line: parameter.getStartLineNumber(),
			name: parameter.getName(),
			parameterTypes: [],
			returns: undefined,
			valueTypes: this.types.classTypesIn(parameter.getType()),
			visibility: this.visibilityOf(parameter.getScope() ?? Scope.Public),
		});
	}

	private heritageOf(declaration: MorphClass): Heritage | undefined {
		const clause = declaration.getExtends();
		if (clause === undefined) {
			return undefined;
		}
		const parameters = declaration.getBaseClass()?.getTypeParameters() ?? [];
		const typeArguments: TypeArgument[] = clause.getTypeArguments().map((argument, index) => ({
			line: argument.getStartLineNumber(),
			parameter: parameters[index]?.getName() ?? argument.getText(),
			types: this.types.classTypesIn(argument.getType()),
		}));
		return { isByName: this.namesAClass(clause.getExpression()), typeArguments };
	}

	/**
	 * `extends Order` or `extends core.Order` naming a class declaration, rather than a call, a cast or a constant.
	 * A name that resolves to nothing, such as a broken import, is still a name: what it is stays unknown, not hidden.
	 */
	private namesAClass(expression: Node): boolean {
		if (!Node.isIdentifier(expression) && !Node.isPropertyAccessExpression(expression)) {
			return false;
		}
		const symbol = expression.getSymbol();
		const target = symbol?.getAliasedSymbol() ?? symbol;
		const declarations = target?.getDeclarations() ?? [];
		return declarations.length === 0 || declarations.some((candidate) => Node.isClassDeclaration(candidate));
	}

	private visibilityOf(scope: Scope): Visibility {
		if (scope === Scope.Private) {
			return "private";
		}
		if (scope === Scope.Protected) {
			return "protected";
		}
		return "public";
	}
}
