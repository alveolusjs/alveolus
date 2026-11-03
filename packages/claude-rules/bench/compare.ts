import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { BenchComparison } from './runner/bench-comparison.ts';

const [base, head] = process.argv.slice(2);

if (base === undefined || head === undefined) {
	throw new Error('Usage: node bench/compare.ts <base label> <head label>');
}

const resultsDir = join(dirname(fileURLToPath(import.meta.url)), 'results');

console.log(new BenchComparison(resultsDir, base, head).render());
