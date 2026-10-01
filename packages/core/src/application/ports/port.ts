/**
 * Technical port of the application: a capability it needs from the outside world, such as a
 * clock, an identifier generator, a mailer or a payment gateway.
 *
 * Declare one interface per port in `application/ports/` (of a bounded context, or of the shared
 * kernel when every context uses it), extending this one with its methods, and implement it in a
 * driven adapter. The interface has no member of its own: it marks the port so that the
 * architecture rules can find it and its adapters.
 *
 * @example
 * ```ts
 * export interface Clock extends Port {
 *   now(): Date;
 * }
 *
 * export class SystemClock implements Clock {
 *   now(): Date {
 *     return new Date();
 *   }
 * }
 * ```
 *
 * @see {@link https://alveolusjs.github.io/alveolus/core/application/ports | Ports}
 */
export interface Port {}
