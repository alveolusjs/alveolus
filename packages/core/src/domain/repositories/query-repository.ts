import { Port } from '../ports/index.ts';

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- View names the view a query repository reads, for its subclasses
export abstract class QueryRepository<View extends object> extends Port {}
