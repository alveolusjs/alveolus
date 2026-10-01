import type { Result } from "../../utilities/result/index.ts";
import type { AnyDomainError } from "../domain-errors/index.ts";

/**
 * Business rule made explicit as an object, so that it can be named, tested and replaced.
 *
 * A policy answers one question about a subject: is it allowed? `check` returns `ok()` when the
 * rule holds and `err(error)` with a {@link DomainError} when it does not. Pass several values as
 * one object. Like a domain service, a policy is stateless: it may receive values at construction,
 * but reads no clock and performs no I/O.
 *
 * @typeParam Subject - What the rule is checked against.
 * @typeParam Error - {@link DomainError} returned when the rule does not hold.
 *
 * @example
 * ```ts
 * class OverbookingPolicy extends Policy<{ cargo: Cargo; voyage: Voyage }, VoyageOverbooked> {
 *   check({ cargo, voyage }: { cargo: Cargo; voyage: Voyage }): Result<void, VoyageOverbooked> {
 *     if (voyage.bookedSize + cargo.size > voyage.capacity * 1.1) return err(new VoyageOverbooked());
 *     return ok();
 *   }
 * }
 *
 * voyage.book(cargo, new OverbookingPolicy());
 * ```
 *
 * @see {@link https://alveolusjs.github.io/alveolus/core/domain/policies | Policies}
 */
export abstract class Policy<Subject, Error extends AnyDomainError = AnyDomainError> {
	public abstract check(subject: Subject): Result<void, Error>;
}
