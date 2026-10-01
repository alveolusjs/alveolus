# Policies

A policy is a business rule made explicit as an object, so that it can be named, tested and
replaced. It answers one question about a subject, "is it allowed?", with `ok()` or a domain error.

```ts
export class OverbookingPolicy extends Policy<Booking, VoyageOverbooked> {
	check({ voyage, cargo }: Booking): Result<void, VoyageOverbooked> { … }
}
```

## When to use

Extract a policy when a rule matters enough to have a name in the business, changes on its own, or
has variants: an overbooking allowance, a credit limit, a cancellation window. A rule that never
varies can stay inside the aggregate method. To compute something rather than accept or refuse,
use a [domain service](./domain-services.md).

## Usage

### Declare a policy

Extend `Policy` with the subject it checks and the [domain error](./domain-errors.md) it returns,
in the `domain/policies/` folder. Pass several values as one object.

```ts [src/shipping/domain/policies/overbooking.policy.ts]
import { err, ok, Policy, type Result } from "@alveolus/core";
import type { Cargo } from "../aggregates/cargo.aggregate.ts";
import type { Voyage } from "../aggregates/voyage.aggregate.ts";
import { VoyageOverbooked } from "../errors/voyage.error.ts";

export interface Booking {
	readonly voyage: Voyage;
	readonly cargo: Cargo;
}

export class OverbookingPolicy extends Policy<Booking, VoyageOverbooked> {
	check({ voyage, cargo }: Booking): Result<void, VoyageOverbooked> {
		if (voyage.bookedSize + cargo.size > voyage.capacity * 1.1) {
			return err(new VoyageOverbooked({ voyageId: voyage.id.value }));
		}
		return ok();
	}
}
```

### Apply it in an aggregate

The aggregate receives the policy as a parameter and refuses the change when the rule does not
hold.

```ts
book(cargo: Cargo, policy: Policy<Booking, VoyageOverbooked>): Result<void, VoyageOverbooked> {
	const allowed = policy.check({ voyage: this, cargo });
	if (!allowed.ok) {
		return allowed;
	}
	this.bookedSize += cargo.size;
	return ok();
}
```

### Replace it

Any policy with the same subject and error fits. Configure values at construction, in `readonly`
fields.

```ts
export class FixedOverbookingPolicy extends Policy<Booking, VoyageOverbooked> {
	private readonly allowance: number;

	constructor(allowance: number) {
		super();
		this.allowance = allowance;
	}

	check({ voyage, cargo }: Booking): Result<void, VoyageOverbooked> { … }
}

voyage.book(cargo, new FixedOverbookingPolicy(0.2));
```

## Reference

```ts
abstract class Policy<Subject, Error extends AnyDomainError = AnyDomainError>
```

| Type parameter | Description                                          |
| -------------- | ---------------------------------------------------- |
| `Subject`      | What the rule is checked against.                    |
| `Error`        | The domain error returned when the rule does not hold. |

| Member            | Type                    | Description                                         |
| ----------------- | ----------------------- | --------------------------------------------------- |
| `check(subject)`  | `Result<void, Error>`   | Abstract. `ok()` when the rule holds, `err(error)` otherwise. |

Import from `@alveolus/core` or `@alveolus/core/policies`.

## See also

- [Domain Services](./domain-services.md), for operations that compute a value
- [Domain Errors](./domain-errors.md), returned when the rule does not hold
- [Policy rules](/arch/rules/policies), checked by `alveolus arch check`
