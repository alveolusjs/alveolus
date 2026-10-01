import { describe, expect, it } from "vitest";

import { SequentialIdGenerator } from "../../../test/fixtures/application.ts";
import { IdGenerator } from "./id-generator.ts";
import { Port } from "./port.ts";

describe("IdGenerator", () => {
	it("is a port that gives a new id on each call", () => {
		const ids: IdGenerator = new SequentialIdGenerator();

		expect([ids.next(), ids.next()]).toEqual(["evt_1", "evt_2"]);
		expect(ids).toBeInstanceOf(IdGenerator);
		expect(ids).toBeInstanceOf(Port);
	});
});
