#!/usr/bin/env node
import { Cli } from "./cli/index.ts";

const cli = new Cli(process.stdout, process.stderr, process.cwd(), process.stdout.isTTY);
process.exitCode = await cli.run(process.argv.slice(2));
