import { fileURLToPath } from "node:url";

import type { Violation } from "../src/index.ts";
import { check } from "../src/index.ts";

export function fixture(name: "valid" | "invalid"): string {
	return fileURLToPath(new URL(`./fixtures/${name}/tsconfig.json`, import.meta.url));
}

let invalidViolations: Violation[] | undefined;

export function invalidProjectViolations(): Violation[] {
	invalidViolations ??= check({ project: fixture("invalid") });
	return invalidViolations;
}

export function reported(file: string): { rule: string; line: number; message: string }[] {
	return invalidProjectViolations()
		.filter((violation) => violation.file.endsWith(file))
		.map(({ rule, line, message }) => ({ line, message, rule }));
}
