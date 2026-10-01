/**
 * Expected business failure, returned in the error branch of a {@link Result} rather than thrown.
 *
 * Declare one subclass per failure, named after what went wrong, with an optional typed payload.
 * The error `type` is the name of its class, so keep class names when bundling or minifying (for
 * example esbuild `keepNames`). A `DomainError` is a value: it is not an `Error` and has no stack
 * trace. Throw exceptions only for bugs and broken invariants.
 *
 * @typeParam Payload - Data describing the failure. Omit it for errors without data.
 *
 * @example
 * ```ts
 * class OrderAlreadyPlaced extends DomainError {}
 * class InvalidTotal extends DomainError<{ total: number }> {}
 *
 * place(total: number, now: Date): Result<void, OrderAlreadyPlaced | InvalidTotal> {
 *   if (this.placed) return err(new OrderAlreadyPlaced());
 *   if (total <= 0) return err(new InvalidTotal({ total }));
 *   return ok();
 * }
 * ```
 *
 * @see {@link https://alveolusjs.github.io/alveolus/core/domain/domain-errors | Domain Errors}
 */
export abstract class DomainError<Payload = undefined> {
	public readonly payload: Payload;

	public constructor(...[payload]: Payload extends undefined ? [] : [payload: Payload]) {
		this.payload = payload as Payload;
	}

	public get type(): string {
		return this.constructor.name;
	}
}

export type AnyDomainError = DomainError<unknown>;
