import { defineProject } from "vitest/config";

export default defineProject({
	ssr: {
		resolve: {
			conditions: ["@alveolus/source", "module", "node", "development|production"],
		},
	},
	test: {
		include: ["src/**/*.test.ts", "test/*.test.ts"],
		name: "arch",
		testTimeout: 30000,
	},
});
