import { describe, expect, it } from "vitest";

import { Config } from "../../config/index.ts";
import { Layout } from "./layout.ts";

const layout = new Layout(new Config({ boundedContexts: { ordering: "ordering" }, root: "src" }, "/project"));

describe("Layout", () => {
	it("locates a file in a layer and a folder of a bounded context", () => {
		const location = layout.locate("/project/src/ordering/domain/aggregates/order.aggregate.ts");

		expect([location.area, location.context, location.layer, location.folder]).toEqual(["context", "ordering", "domain", "aggregates"]);
	});

	it("takes the folder that holds the file, after any technical subfolder", () => {
		const location = layout.locate("/project/src/ordering/driven/pg/adapters/pg-orders.adapter.ts");

		expect([location.layer, location.folder]).toEqual(["driven", "adapters"]);
	});

	it("has no folder for a file directly in a layer", () => {
		expect(layout.locate("/project/src/ordering/driving/orders.controller.ts").folder).toBeUndefined();
	});

	it("recognises the composition root of a bounded context", () => {
		expect(layout.locate("/project/src/ordering/ordering.module.ts").isCompositionRoot).toBe(true);
		expect(layout.locate("/project/src/ordering/helpers.ts").isCompositionRoot).toBe(false);
	});

	it("tells the shared kernel, the root and unknown folders apart", () => {
		expect(layout.locate("/project/src/shared-kernel/domain/ports/clock.port.ts").area).toBe("shared-kernel");
		expect(layout.locate("/project/src/main.ts").area).toBe("root");
		expect(layout.locate("/project/src/common/strings.ts").area).toBe("outside");
	});

	it("supports nested bounded contexts and a shared kernel grouped by feature", () => {
		const nested = new Layout(new Config({ boundedContexts: { ordering: "modules/ordering" }, root: "src", sharedKernel: "shared" }, "/project"));

		const order = nested.locate("/project/src/modules/ordering/domain/aggregates/order.aggregate.ts");
		const clock = nested.locate("/project/src/shared/time/driven/system-clock.adapter.ts");

		expect([order.context, order.layer]).toEqual(["ordering", "domain"]);
		expect([clock.area, clock.layer]).toEqual(["shared-kernel", "driven"]);
		expect(nested.locate("/project/src/app.module.ts").area).toBe("root");
	});

	it("recognises the composition root of each feature of the shared kernel, not of a bounded context subfolder", () => {
		const nested = new Layout(new Config({ boundedContexts: { ordering: "ordering" }, root: "src", sharedKernel: "shared" }, "/project"));

		expect(nested.locate("/project/src/shared/time/time.module.ts").isCompositionRoot).toBe(true);
		expect(nested.locate("/project/src/shared/time/helpers.ts").isCompositionRoot).toBe(false);
		expect(nested.locate("/project/src/shared/time/nested/time.module.ts").isCompositionRoot).toBe(false);
		expect(nested.locate("/project/src/ordering/pricing/pricing.module.ts").isCompositionRoot).toBe(false);
	});

	it("takes the layer from the first folder of a context only, and keeps the folders below it", () => {
		const nested = layout.locate("/project/src/ordering/legacy/domain/aggregates/order.aggregate.ts");
		const adapter = layout.locate("/project/src/ordering/driven/pg/adapters/pg-orders.adapter.ts");

		expect(nested.layer).toBeUndefined();
		expect(adapter.foldersInLayer).toEqual(["pg", "adapters"]);
	});
});
