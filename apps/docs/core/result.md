# Result

Expected business failures are values, not exceptions. `Result<T, E>` is a discriminated union, so
TypeScript narrows it natively.

```ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

Helpers are plain functions: `ok`, `err`, `map`, `mapErr`, `andThen`.

```ts
const email = Email.create(input);

if (!email.ok) {
	return err(email.error);
}

email.value; // Email
```
