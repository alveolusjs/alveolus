import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		coverage: {
			exclude: ["**/*.test.ts", "**/test/**", "**/dist/**", "**/*.config.ts", "packages/arch/src/bin.ts"],
			include: ["packages/*/src/**"],
			provider: "v8",
			reporter: ["text-summary", "json-summary", "lcov"],
			thresholds: { branches: 90, functions: 95, lines: 95, statements: 95 },
		},
		passWithNoTests: true,
		projects: ["packages/*"],
	},
});
