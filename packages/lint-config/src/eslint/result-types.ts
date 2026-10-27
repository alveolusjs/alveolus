import type { Rule as EslintRule } from 'eslint';
import ts from 'typescript';

import { ModuleTargets } from './module-targets.ts';

type ParserServices = {
	readonly program: unknown;
	readonly esTreeNodeToTSNodeMap: unknown;
};

export class ResultTypes {
	readonly #checker: ts.TypeChecker;
	readonly #nodes: WeakMap<object, unknown>;

	private constructor(checker: ts.TypeChecker, nodes: WeakMap<object, unknown>) {
		this.#checker = checker;
		this.#nodes = nodes;
	}

	public static of(context: EslintRule.RuleContext): ResultTypes | undefined {
		const services: unknown = context.sourceCode.parserServices;

		if (!ResultTypes.#isParserServices(services)) {
			return undefined;
		}

		const { program, esTreeNodeToTSNodeMap } = services;

		if (!ModuleTargets.isProgram(program) || !(esTreeNodeToTSNodeMap instanceof WeakMap)) {
			return undefined;
		}

		return new ResultTypes(program.getTypeChecker(), esTreeNodeToTSNodeMap);
	}

	static #isParserServices(value: unknown): value is ParserServices {
		return typeof value === 'object' && value !== null && 'program' in value && 'esTreeNodeToTSNodeMap' in value;
	}

	static #isNode(value: unknown): value is ts.Node {
		return typeof value === 'object' && value !== null && 'kind' in value && 'pos' in value;
	}

	public isResult(node: object): boolean {
		const type = this.#type(node);

		return type !== undefined && this.#isResultType(type);
	}

	public isAwaitedResult(node: object): boolean {
		const type = this.#type(node);

		return type !== undefined && this.#isResultType(this.#checker.getAwaitedType(type) ?? type);
	}

	public isVariable(node: object): boolean {
		const found = this.#node(node);
		const symbol = found === undefined ? undefined : this.#checker.getSymbolAtLocation(found);

		return symbol !== undefined && (symbol.flags & ts.SymbolFlags.Variable) !== 0;
	}

	#type(node: object): ts.Type | undefined {
		const found = this.#node(node);

		return found === undefined ? undefined : this.#checker.getTypeAtLocation(found);
	}

	#node(node: object): ts.Node | undefined {
		const found = this.#nodes.get(node);

		if (!ResultTypes.#isNode(found)) {
			return undefined;
		}

		return ts.isExpressionStatement(found) ? found.expression : found;
	}

	#isResultType(type: ts.Type): boolean {
		if (!type.isUnion()) {
			return false;
		}

		const outcomes = type.types;

		return (
			outcomes.every((outcome) => this.#ok(outcome) !== undefined) &&
			outcomes.some((outcome) => outcome.getProperty('value') !== undefined) &&
			outcomes.some((outcome) => outcome.getProperty('error') !== undefined)
		);
	}

	#ok(outcome: ts.Type): boolean | undefined {
		const ok = outcome.getProperty('ok');

		if (ok === undefined) {
			return undefined;
		}

		const type = this.#checker.getTypeOfSymbol(ok);

		if (type.flags & ts.TypeFlags.BooleanLiteral) {
			return this.#checker.typeToString(type) === 'true';
		}

		return undefined;
	}
}
