#!/usr/bin/env node
import process from "node:process";
import { parseArgs } from "node:util";

import { check } from "./check.ts";
import { formatViolations } from "./format.ts";

const usage = "Usage: alveolus arch check [--project <tsconfig.json>]";

function run(): number {
	let parsed: ReturnType<
		typeof parseArgs<{ allowPositionals: true; options: { project: { type: "string"; short: "p" } } }>
	>;
	try {
		parsed = parseArgs({ allowPositionals: true, options: { project: { short: "p", type: "string" } } });
	} catch {
		process.stderr.write(`${usage}\n`);
		return 2;
	}
	if (parsed.positionals.join(" ") !== "arch check") {
		process.stderr.write(`${usage}\n`);
		return 2;
	}
	try {
		const violations = check(parsed.values.project === undefined ? {} : { project: parsed.values.project });
		process.stdout.write(`${formatViolations(violations, process.cwd())}\n`);
		return violations.length === 0 ? 0 : 1;
	} catch (error) {
		process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
		return 2;
	}
}

process.exitCode = run();
