import { Port } from '../ports/index.ts';

// oxlint-disable-next-line no-unused-vars -- View names the view a query repository reads, for its subclasses
export abstract class QueryRepository<View extends object> extends Port {}
