#!/usr/bin/env node
import { fileURLToPath } from "node:url";

import { Cli } from "./cli/index.ts";
import { Docs } from "./docs/index.ts";

const docs = new Docs(fileURLToPath(new URL("../docs/", import.meta.url)));
const cli = new Cli(process.stdout, process.stderr, process.cwd(), docs, process.stdout.isTTY);
process.exitCode = await cli.run(process.argv.slice(2));
