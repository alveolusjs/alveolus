import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "arch",
		include: ["src/**/*.test.ts", "test/**/*.test.ts"],
	},
});
