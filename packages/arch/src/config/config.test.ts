import { describe, expect, it } from "vitest";

import { join, resolve } from "node:path";

import { Config } from "./config.ts";

const project = resolve("/project");

describe("Config", () => {
	it("applies the defaults of the convention", () => {
		const config = new Config({ boundedContexts: { ordering: "ordering" }, root: "src", subdomains: { core: ["ordering"] } }, "/project");

		expect([config.rootDir, config.compositionRoot]).toEqual([join(project, "src"), "*.module.ts"]);
		expect([config.domainDependencies.has("decimal.js"), config.applicationDependencies.has("decimal.js")]).toEqual([false, false]);
		expect(config.contextFolders).toEqual([
			{ dir: join(project, "src", "ordering"), isSharedKernel: false, name: "ordering", subdomain: "core" },
			{ dir: join(project, "src", "shared-kernel"), isSharedKernel: true, name: "shared kernel" },
		]);
	});

	it("accepts nested bounded contexts and a shared kernel anywhere under the root", () => {
		const config = new Config({ boundedContexts: { ordering: "modules/ordering" }, root: "src", sharedKernel: "shared", subdomains: { core: ["ordering"] } }, "/project");

		expect(config.contextFolders.map((folder) => folder.dir)).toEqual([join(project, "src", "modules", "ordering"), join(project, "src", "shared")]);
	});

	it("ignores test files by default, and the globs it is given", () => {
		const config = new Config({ boundedContexts: {}, ignore: ["src/**/testing/**"], root: "src" }, "/project");

		expect(config.isIgnored("/project/src/ordering/domain/order.aggregate.spec.ts")).toBe(true);
		expect(config.isIgnored("/project/src/ordering/domain/order.aggregate.test.ts")).toBe(true);
		expect(config.isIgnored("/project/src/ordering/domain/__tests__/order.ts")).toBe(true);
		expect(config.isIgnored("/project/src/ordering/testing/order.builder.ts")).toBe(true);
		expect(config.isIgnored("/project/src/ordering/domain/order.aggregate.ts")).toBe(false);
	});

	it("reports every rule as an error, unless the configuration lowers it or turns it off", () => {
		const config = new Config({ boundedContexts: {}, root: "src", rules: { "tactical/no-loose-code": "info", "tactical/no-misplaced-class": "off", "tactical/no-public-field": "warn" } }, "/project");

		expect(config.severityOf("tactical/no-misplaced-class")).toBe("off");
		expect(config.severityOf("tactical/no-public-field")).toBe("warn");
		expect(config.severityOf("tactical/no-loose-code")).toBe("info");
		expect(config.severityOf("strategic/no-cross-context-import")).toBe("error");
	});

	it("ignores the companions of tests too: end-to-end specs, fixtures, stories and mocks", () => {
		const config = new Config({ boundedContexts: { ordering: "ordering" }, root: "src", subdomains: { core: ["ordering"] } }, "/project");

		expect(config.isIgnored("/project/src/ordering/driving/http/orders.e2e-spec.ts")).toBe(true);
		expect(config.isIgnored("/project/src/ordering/domain/order.fixture.ts")).toBe(true);
		expect(config.isIgnored("/project/src/ordering/driving/http/orders.stories.ts")).toBe(true);
		expect(config.isIgnored("/project/src/ordering/__mocks__/orders.ts")).toBe(true);
	});

	it("reads the sources with tsconfig.json, or the configuration named", () => {
		expect(new Config({ boundedContexts: {}, root: "src" }, "/project").tsConfigPath).toBe(join(project, "tsconfig.json"));
		expect(new Config({ boundedContexts: {}, root: "src", tsconfig: "tsconfig.build.json" }, "/project").tsConfigPath).toBe(join(project, "tsconfig.build.json"));
	});

	it("requires every bounded context to be classified as core, supporting or generic, once", () => {
		const contexts = { billing: "billing", ordering: "ordering" };

		expect(() => new Config({ boundedContexts: contexts, root: "src" }, "/project")).toThrow(
			"boundedContexts declares billing, ordering, which subdomains does not classify: list each context under subdomains.core, subdomains.supporting or subdomains.generic.",
		);
		expect(() => new Config({ boundedContexts: contexts, root: "src", subdomains: { core: ["ordering"], generic: ["notifications"] } }, "/project")).toThrow(
			"subdomains names notifications, which boundedContexts does not declare.",
		);
		expect(() => new Config({ boundedContexts: contexts, root: "src", subdomains: { core: ["ordering", "billing"], supporting: ["billing"] } }, "/project")).toThrow(
			"subdomains lists billing as core and as supporting: a bounded context implements one subdomain.",
		);

		const config = new Config({ boundedContexts: contexts, root: "src", subdomains: { core: ["ordering"], supporting: ["billing"] } }, "/project");

		expect(config.contextFolders.map((folder) => [folder.name, folder.subdomain])).toEqual([
			["ordering", "core"],
			["billing", "supporting"],
			["shared kernel", undefined],
		]);
	});

	it("refuses a context map that names an unknown context, or that has a cycle", () => {
		const contexts = { ledger: "ledger", payments: "payments" };
		const subdomains = { core: ["ledger", "payments"] };

		expect(() => new Config({ boundedContexts: contexts, contextMap: { payments: ["billing"] }, root: "src", subdomains }, "/project")).toThrow(
			"contextMap names billing, which boundedContexts does not declare.",
		);
		expect(() => new Config({ boundedContexts: contexts, contextMap: { ledger: ["payments"], payments: ["ledger"] }, root: "src", subdomains }, "/project")).toThrow(
			"contextMap has a cycle: ledger → payments → ledger.",
		);
		expect(new Config({ boundedContexts: contexts, contextMap: { payments: ["ledger"] }, root: "src", subdomains }, "/project").contextMap?.allows("payments", "ledger")).toBe(true);
	});
});
