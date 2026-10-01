import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "testing",
		include: ["src/**/*.test.ts", "test/**/*.test.ts"],
	},
});
