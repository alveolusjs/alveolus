#!/usr/bin/env node
import process from "node:process";

const [command, subcommand] = process.argv.slice(2);

if (command === "arch" && subcommand === "check") {
	console.error("alveolus arch check: not implemented yet");
	process.exit(1);
}

console.error("Usage: alveolus arch check");
process.exit(1);
