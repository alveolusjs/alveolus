import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../test/support/test-codebase.ts";

const path = "src/ordering/domain/aggregates/order.aggregate.ts";

describe("TsMorphImporter", () => {
	it("reads every form of dependency, and where it points", () => {
		const file = new TestCodebase()
			.file("src/ordering/domain/value-objects/money.value-object.ts", `export class Money {}`)
			.file(
				path,
				`import { Money } from "../value-objects/money.value-object.ts";
			export { Money as Cash } from "../value-objects/money.value-object.ts";
			type Pool = import("pg").Pool;
			const lazy = () => import("./missing.ts");
			const legacy = require("pg");
			import pg = require("pg");`,
			)
			.readFile(path);

		expect(file.dependencies.map((dependency) => [dependency.line, dependency.form, dependency.label, dependency.target])).toEqual([
			[1, "import", "Money", { kind: "file", path: "/project/src/ordering/domain/value-objects/money.value-object.ts", visibility: "analysed" }],
			[2, "re-export", "Money", { kind: "file", path: "/project/src/ordering/domain/value-objects/money.value-object.ts", visibility: "analysed" }],
			[3, "inline type", "Pool", { kind: "package", name: "pg" }],
			[4, "dynamic import", "*", { kind: "file", path: "/project/src/ordering/domain/aggregates/missing.ts", visibility: "unresolved" }],
			[5, "require", "*", { kind: "package", name: "pg" }],
			[6, "require", "*", { kind: "package", name: "pg" }],
		]);
	});

	it("reads a class: its lineage with packages, its heritage, its markers and its members in source order", () => {
		const file = new TestCodebase()
			.file(
				path,
				`import { AggregateRoot, Identifier, type OpenHostService, type Result } from "@alveolus/core";
			class OrderId extends Identifier<string, "OrderId"> {}
			class Customer extends AggregateRoot<OrderId> { toSnapshot() { return {}; } }
			export class Order extends AggregateRoot<OrderId> implements OpenHostService {
				private readonly customers: Record<string, Customer> = {};
				public onChange: (customer: Customer) => void = () => {};
				public constructor(id: OrderId, private readonly owner: Customer) { super(id); }
				public static create(): Order | undefined { return undefined; }
				public place(by: Customer): Result<void, never> { return { ok: true, value: undefined } as never; }
				public get first(): Customer | undefined { return undefined; }
				public set status(value: string) {}
				public toSnapshot() { return {}; }
			}`,
			)
			.readFile(path);
		const order = file.classNamed("Order");

		expect(order?.type.lineage.map((type) => `${type.name}@${type.packageName}`)).toEqual(["Order@undefined", "AggregateRoot@@alveolus/core", "Entity@@alveolus/core"]);
		expect(order?.heritage).toEqual({ isByName: true, typeArguments: [{ line: 4, parameter: "Id", types: [expect.objectContaining({ name: "OrderId" })] }] });
		expect(order?.implemented).toEqual([{ name: "OpenHostService", packageName: "@alveolus/core" }]);
		expect(order?.members.map((member) => [member.kind, member.name, member.visibility, member.isStatic, member.valueTypes.map((type) => type.name)])).toEqual([
			["field", "customers", "private", false, ["Customer"]],
			["field", "onChange", "public", false, []],
			["constructor parameter", "id", "public", false, ["OrderId"]],
			["constructor parameter", "owner", "private", false, ["Customer"]],
			["method", "create", "public", true, ["Order"]],
			["method", "place", "public", false, []],
			["getter", "first", "public", false, ["Customer"]],
			["setter", "status", "public", false, []],
			["method", "toSnapshot", "public", false, []],
		]);
		expect(order?.members.find((member) => member.name === "place")).toMatchObject({
			parameterTypes: [expect.objectContaining({ name: "Customer" })],
			returns: { alias: { name: "Result", packageName: "@alveolus/core" } },
		});
		expect(order?.members.find((member) => member.name === "onChange")?.isCallable).toBe(true);
	});

	it("reads the top-level statements that are no declaration of data, and the failures raised", () => {
		const file = new TestCodebase()
			.file(
				path,
				`export const limit = 10;
			export function total(): number { throw new Error("no"); }
			export let calls = 0;
			export const later = () => Promise.reject(new Error("no"));`,
			)
			.readFile(path);

		expect(file.statements.map((statement) => [statement.kind, statement.name, statement.line])).toEqual([
			["function", "total", 2],
			["mutable variable", "calls", 3],
			["function", "later", 4],
		]);
		expect(file.throws.map((thrown) => [thrown.form, thrown.line])).toEqual([
			["throw", 2],
			["Promise.reject", 4],
		]);
	});

	it("tells the globals of ECMAScript, of the host and of the project apart", () => {
		const file = new TestCodebase()
			.file("src/ordering/driven/db/global-db.ts", `declare global { var db: { query(sql: string): void }; }\nexport {};`)
			.file(path, `export const values = [JSON.stringify([]), Date.now(), fetch("x"), globalThis.db];`)
			.readFile(path);

		expect(file.globals.map((global) => [global.name, global.origin, global.effect])).toEqual([
			["JSON", "ecmascript", undefined],
			["Date.now", "ecmascript", "clock"],
			["fetch", "host", undefined],
		]);
		expect(file.dependencies.map((dependency) => [dependency.form, dependency.label])).toEqual([["global", "db"]]);
	});

	it("reads a base class that resolves to nothing as extended by name, not by an expression", () => {
		const file = new TestCodebase().file(path, `import { Base } from "./missing.ts";\nexport class Order extends Base {}`).readFile(path);

		expect(file.classNamed("Order")?.heritage?.isByName).toBe(true);
	});

	it("tells whether a package can be imported from the sources", () => {
		const codebase = new TestCodebase();

		expect(codebase.importer.resolves("@alveolus/core", codebase.config)).toBe(true);
		expect(codebase.importer.resolves("left-pad", codebase.config)).toBe(false);
	});

	it("reads the disable comments, with what follows the marker", () => {
		const file = new TestCodebase()
			.file(path, `// alveolus-disable-next-line layers/no-impure-domain: legacy pool\nimport { Pool } from "pg";\n//alveolus-disable-next-line\nexport const pool = new Pool();`)
			.readFile(path);

		expect(file.disables.map((comment) => [comment.line, comment.target, comment.text])).toEqual([
			[1, 2, "layers/no-impure-domain: legacy pool"],
			[3, 4, ""],
		]);
	});
});
