# driven-adapters-extend-port

A driven adapter exists to implement a port. Every class in `driven/<technology>/adapters/` extends
one, and every port is declared by the domain.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/driven/smtp/adapters/mailer.adapter.ts]
export class Mailer {
	async send(to: string, body: string): Promise<void> {}
}
```

```ts [✅ Prefer: src/ordering/driven/smtp/adapters/smtp-notifications.adapter.ts]
import { Notifications } from "../../../domain/ports/notifications.port";

export class SmtpNotifications extends Notifications {
	async orderPlaced(email: string): Promise<void> {}
}
```

</div>

## What it checks

- Every class in a `driven/**/adapters/` folder extends a `Port`, directly or through a repository,
  `Outbox`, `EventPublisher`, `UnitOfWork`, `Clock` or `IdGenerator`.
- Every abstract class that extends `Port` is declared in `domain/ports/` or
  `domain/repositories/`. Abstract base classes for your adapters may also live in
  `driven/**/adapters/`.

## Why

An adapter that implements no port is called directly by the application, which then depends on
the technology. Requiring a port keeps the dependency where it belongs: the domain says what it
needs, in its own words, and the adapter fits that shape. It is also what lets you swap the adapter
in tests or when the technology changes.

A port declared in the application or in an adapter folder hides a dependency the domain does not
know about. Ports belong to the domain.

## What it reports

```
src/ordering/driven/smtp/adapters/mailer.adapter.ts:1
  driven-adapters-extend-port: Mailer is a driven adapter but extends no Port: extend the port it implements.

src/ordering/application/commands/notifications.ts:3
  driven-adapters-extend-port: The port Notifications is declared outside the domain: move it to domain/ports/ or domain/repositories/.
```

## Turn it off

```ts
rules: { "driven-adapters-extend-port": "off" }
```

## See also

- [`placement`](./placement.md), for the folder and file name of an adapter
- [Project layout: layers](../guide/project-layout.md#layers)
