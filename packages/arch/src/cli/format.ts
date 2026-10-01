import { relative } from "node:path";

import type { Violation } from "../building-blocks/index.ts";

export function formatViolations(violations: readonly Violation[], cwd: string): string {
	if (violations.length === 0) {
		return "✔ No violations";
	}
	const lines = violations.map(
		({ file, line, column, rule, message }) => `${relative(cwd, file)}:${line}:${column}  ${rule}\n  ${message}`,
	);
	const count = `✖ ${violations.length} violation${violations.length === 1 ? "" : "s"}`;
	return `${lines.join("\n\n")}\n\n${count}`;
}
