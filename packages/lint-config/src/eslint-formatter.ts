import type { ESLint } from 'eslint';

import { LintReport } from './reporter/lint-report.ts';

export default (results: ESLint.LintResult[], context: ESLint.LintResultData): string =>
	new LintReport(results, context).render();
