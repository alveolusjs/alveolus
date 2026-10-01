import { describe, expect, it } from "vitest";

import { Config } from "./config.ts";

describe("Config", () => {
	it("applies the defaults of the convention", () => {
		const config = new Config({ boundedContexts: { ordering: "ordering" }, root: "src" }, "/project");

		expect([config.rootDir, config.compositionRoot, config.domainDependencies]).toEqual(["/project/src", "*.module.ts", []]);
		expect(config.contextFolders).toEqual([
			{ dir: "/project/src/ordering", isSharedKernel: false, name: "ordering" },
			{ dir: "/project/src/shared-kernel", isSharedKernel: true, name: "shared kernel" },
		]);
	});

	it("accepts nested bounded contexts and a shared kernel anywhere under the root", () => {
		const config = new Config({ boundedContexts: { ordering: "modules/ordering" }, root: "src", sharedKernel: "shared" }, "/project");

		expect(config.contextFolders.map((folder) => folder.dir)).toEqual(["/project/src/modules/ordering", "/project/src/shared"]);
	});

	it("ignores test files by default, and the globs it is given", () => {
		const config = new Config({ boundedContexts: {}, ignore: ["src/**/testing/**"], root: "src" }, "/project");

		expect(config.isIgnored("/project/src/ordering/domain/order.aggregate.spec.ts")).toBe(true);
		expect(config.isIgnored("/project/src/ordering/domain/order.aggregate.test.ts")).toBe(true);
		expect(config.isIgnored("/project/src/ordering/domain/__tests__/order.ts")).toBe(true);
		expect(config.isIgnored("/project/src/ordering/testing/order.builder.ts")).toBe(true);
		expect(config.isIgnored("/project/src/ordering/domain/order.aggregate.ts")).toBe(false);
	});

	it("enables every rule unless it is turned off", () => {
		const config = new Config({ boundedContexts: {}, root: "src", rules: { placement: "off" } }, "/project");

		expect(config.isEnabled("placement")).toBe(false);
		expect(config.isEnabled("bc-isolation")).toBe(true);
	});
});
