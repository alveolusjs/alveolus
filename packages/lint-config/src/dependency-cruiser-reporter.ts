import type { ICruiseResult, IReporterOutput } from 'dependency-cruiser';

import { ViolationReport } from './reporter/violation-report.ts';

export default (result: ICruiseResult): IReporterOutput => new ViolationReport(result, process.cwd()).render();
