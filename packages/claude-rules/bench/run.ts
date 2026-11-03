import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { BenchRun } from './runner/bench-run.ts';
import { BenchSettings } from './runner/bench-settings.ts';

const settings = BenchSettings.fromArguments(dirname(fileURLToPath(import.meta.url)), process.argv.slice(2));

console.log(await new BenchRun(settings).run());
