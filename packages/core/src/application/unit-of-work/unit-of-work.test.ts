import { describe, expect, it } from "vitest";

import { InvalidTotal } from "../../../test/fixtures/application.ts";
import { RecordingUnitOfWork } from "../../../test/fixtures/utilities.ts";
import { Port } from "../../domain/ports/index.ts";
import { err, ok } from "../../utilities/result/index.ts";
import { UnitOfWork } from "./unit-of-work.ts";

describe("UnitOfWork", () => {
	it("commits when the work succeeds and returns its result", async () => {
		const unitOfWork = new RecordingUnitOfWork();

		expect(await unitOfWork.run(() => Promise.resolve(ok(42)))).toEqual(ok(42));
		expect(unitOfWork.log).toEqual(["tx1:begin", "tx1:commit"]);
		expect(unitOfWork).toBeInstanceOf(UnitOfWork);
		expect(unitOfWork).toBeInstanceOf(Port);
	});

	it("rolls back when the work returns an error", async () => {
		const unitOfWork = new RecordingUnitOfWork();
		const failure = err(new InvalidTotal({ total: 0 }));

		expect(await unitOfWork.run(() => Promise.resolve(failure))).toBe(failure);
		expect(unitOfWork.log).toEqual(["tx1:begin", "tx1:rollback"]);
	});

	it("rolls back and rethrows when the work throws", async () => {
		const unitOfWork = new RecordingUnitOfWork();

		await expect(unitOfWork.run(() => Promise.reject(new Error("bug")))).rejects.toThrow("bug");
		expect(unitOfWork.log).toEqual(["tx1:begin", "tx1:rollback"]);
	});

	it("opens one transaction per run", async () => {
		const unitOfWork = new RecordingUnitOfWork();

		await Promise.all([unitOfWork.run(() => Promise.resolve(ok())), unitOfWork.run(() => Promise.resolve(ok()))]);

		expect(unitOfWork.log.toSorted()).toEqual(["tx1:begin", "tx1:commit", "tx2:begin", "tx2:commit"]);
	});
});
