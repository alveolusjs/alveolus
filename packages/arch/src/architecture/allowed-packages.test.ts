import { describe, expect, it } from "vitest";

import { AllowedPackages } from "./allowed-packages.ts";

describe("AllowedPackages", () => {
	it("allows every name of a package declared with true", () => {
		const allowed = new AllowedPackages({ zod: true });

		expect([allowed.has("zod"), allowed.forbiddenNames("zod", ["z", "default"])]).toEqual([true, []]);
	});

	it("allows only the names listed for a package", () => {
		const allowed = new AllowedPackages({ "@nestjs/common": ["Injectable"] });

		expect(allowed.forbiddenNames("@nestjs/common", ["Controller", "Injectable"])).toEqual(["Controller"]);
		expect(allowed.allowedNames("@nestjs/common")).toEqual(["Injectable"]);
	});

	it("knows nothing of an undeclared package", () => {
		expect(new AllowedPackages().has("typeorm")).toBe(false);
	});

	it("merges two declarations, true winning over a list of names", () => {
		const merged = new AllowedPackages({ "date-fns": ["addDays"], zod: ["z"] }).with(new AllowedPackages({ "date-fns": ["format"], zod: true }));

		expect(merged.forbiddenNames("date-fns", ["addDays", "format", "parse"])).toEqual(["parse"]);
		expect(merged.forbiddenNames("zod", ["z", "ZodError"])).toEqual([]);
	});
});
