export interface Ok<T> {
	readonly ok: true;
	readonly value: T;
}

export interface Err<E> {
	readonly ok: false;
	readonly error: E;
}

export type Result<T, E> = Ok<T> | Err<E>;

export function ok(): Ok<void>;
export function ok<T>(value: T): Ok<T>;
export function ok<T>(value?: T): Ok<T | undefined> {
	return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
	return { error, ok: false };
}

export function map<T, E, U>(result: Result<T, E>, transform: (value: T) => U): Result<U, E> {
	return result.ok ? ok(transform(result.value)) : result;
}

export function mapErr<T, E, F>(result: Result<T, E>, transform: (error: E) => F): Result<T, F> {
	return result.ok ? result : err(transform(result.error));
}

export function andThen<T, E, U, F>(result: Result<T, E>, next: (value: T) => Result<U, F>): Result<U, E | F> {
	return result.ok ? next(result.value) : result;
}

type AnyResult = Result<unknown, unknown>;

type ValueOf<R> = R extends Ok<infer T> ? T : never;

type ErrorOf<R> = R extends Err<infer E> ? E : never;

type CombinedValues<Results> = { -readonly [Key in keyof Results]: ValueOf<Results[Key]> };

type CombinedErrors<Results> = Results extends readonly AnyResult[]
	? ErrorOf<Results[number]>
	: ErrorOf<Results[keyof Results]>;

export function combine<const Results extends readonly AnyResult[] | Readonly<Record<string, AnyResult>>>(
	results: Results,
): Result<CombinedValues<Results>, CombinedErrors<Results>> {
	const entries: [string, unknown][] = [];
	for (const [key, result] of Object.entries<AnyResult>(results)) {
		if (!result.ok) {
			return result as Err<CombinedErrors<Results>>;
		}
		entries.push([key, result.value]);
	}
	const values = Array.isArray(results) ? entries.map(([, value]) => value) : Object.fromEntries(entries);
	return ok(values as CombinedValues<Results>);
}
