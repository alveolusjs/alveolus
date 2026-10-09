---
description: "Architecture rule: every driven adapter implements a port declared by the domain, as hexagonal architecture requires."
---

# no-portless-adapter

A driven adapter exists to implement a port: every class in `driven/<technology>/adapters/`
extends one, and every port is declared by the domain.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>layers/no-portless-adapter</code></dd>
	<dt>Category</dt><dd><a href="/rules/#layers">Layers</a>: what each layer may depend on</dd>
	<dt>Reports</dt><dd>A driven adapter that extends no port, a port declared outside the domain</dd>
	<dt>Applies to</dt><dd>Every class in <code>driven/**/adapters/</code>, and every abstract class that extends <code>Port</code>, in core bounded contexts and the shared kernel</dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"layers/no-portless-adapter": "off"</code></a></dd>
</dl>

## Why

A `Mailer` class in `driven/smtp/adapters/` sends emails, and the handler calls it directly. The
application now depends on SMTP: testing a use case sends mail, and moving to an email API means
rewriting the handler.

::: tip The fix
The domain says what it needs in its own words, as a [port](../../core/domain/ports.md); the
adapter extends that port. The handler only knows the port, so the adapter can be swapped in a
test or when the technology changes.
:::

## What it checks

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Every adapter extends a port</span>Every class in a <code>driven/**/adapters/</code> folder extends a <code>Port</code>, directly or through a repository, <code>Outbox</code>, <code>EventPublisher</code>, <code>UnitOfWork</code>, <code>Clock</code> or <code>IdGenerator</code>.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Every port lives in the domain</span>Every abstract class that extends <code>Port</code> is declared in <code>domain/ports/</code> or <code>domain/repositories/</code>.</div>
</div>

Abstract base classes for your adapters may also live in `driven/**/adapters/`, as long as they
extend a port.

## What it reports

```
src/ordering/driven/smtp/adapters/mailer.adapter.ts
  1  error  layers/no-portless-adapter: Mailer is a driven adapter but
  extends no Port: extend the port it implements.

src/ordering/application/commands/notifications.ts
  3  error  layers/no-portless-adapter: The port Notifications is declared
  outside the domain: move it to domain/ports/ or
  domain/repositories/.
```

## Fix it

### Extend the port the adapter implements

So that the application depends on what it needs and not on the technology, declare a port in the
domain and make the adapter extend it. Name the adapter after its technology and its port.

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

### Declare ports in the domain

So that the domain knows every dependency it relies on, a port declared in the application or
next to an adapter moves to `domain/ports/`, or to `domain/repositories/` for a repository.

<div class="al-compare">

```ts [❌ Avoid: src/ordering/application/commands/notifications.ts]
export abstract class Notifications extends Port {
	abstract orderPlaced(email: string): Promise<void>;
}
```

```ts [✅ Prefer: src/ordering/domain/ports/notifications.port.ts]
export abstract class Notifications extends Port {
	abstract orderPlaced(email: string): Promise<void>;
}
```

</div>

## Limits

::: warning What the rule cannot see
- A class in `driven/<technology>/` outside `adapters/`, such as a mapper or an ORM entity: it is
  not an adapter, so it needs no port, and nothing checks what it talks to.
- A port written as an interface: a port is an abstract class that extends `Port`, and an adapter
  that `implements` an interface is reported as extending no port.
:::

## Turn it off

```ts [alveolus.config.ts]
rules: { "layers/no-portless-adapter": "off" },
```

On an existing project, prefer a [baseline](../../guide/getting-started.md#adopt-it-on-an-existing-project):
new adapters extend a port while you wrap the old ones.

## See also

- [Ports](../../core/domain/ports.md), what an adapter implements
- [Project layout: layers](../../guide/project-layout.md#layers)
- [`tactical/no-misplaced-class`](../tactical/no-misplaced-class.md), for the folder and file name
  of an adapter
- [Rules](../index.md), every rule by category
