---
layout: home

hero:
  name: Alveolus
  text: Keep your domain model clean, whoever writes the code.
  tagline: Domain-Driven Design building blocks and architecture checks for TypeScript, for teams and their agents.
  image:
    src: /logo.svg
    alt: Alveolus logo
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Building blocks
      link: /core/
    - theme: alt
      text: GitHub
      link: https://github.com/alveolusjs/alveolus

features:
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3zM7 16.5l-4.74-2.85M7 16.5l5-3m-5 3v5.17m5-8.17V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5zm5 3l-5-3m5 3l4.74-2.85M17 16.5v5.17"/><path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3l5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0zM12 8L7.26 5.15M12 8l4.74-2.85M12 13.5V8"/></g></svg>
    title: Proven patterns, as classes
    details: Aggregates, value objects, domain events, repositories, command handlers. Your classes extend them, and say what they are.
    link: /core/
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12l2 2l4-4"/></g></svg>
    title: Drift caught in CI
    details: alveolus arch check reports code that breaks the architecture, whoever wrote it, and says what is allowed instead.
    link: /rules/
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></g></svg>
    title: One layout for every project
    details: Bounded contexts, layers, a folder per kind of building block. Anyone opening the code knows where a concept lives.
    link: /guide/project-layout
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></g></svg>
    title: Closed bounded contexts
    details: Contexts meet through an open host service and an anti-corruption layer, never by importing each other's model.
    link: /rules/strategic/no-cross-context-import
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></g></svg>
    title: Errors as values
    details: Business failures are returned in a typed Result, never thrown, so every caller sees what can go wrong.
    link: /core/utilities/result
  - icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m19 5 3-3"/><path d="m2 22 3-3"/><path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"/><path d="M7.5 13.5 10 11"/><path d="M10.5 16.5 13 14"/><path d="m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z"/></g></svg>
    title: No infrastructure imposed
    details: No bus, no container, no ORM, no decorator. Core has no runtime dependency and fits NestJS, Express, Fastify, Hono or plain Node.js.
    link: /integrations/
---

<div class="al-home">

## Architectures drift

Deadlines, new teammates, shortcuts taken once and copied ten times: the structure a project
started with erodes. Coding agents speed this up. They solve the task in front of them and forget
the decisions behind the code around it.

Alveolus turns those decisions into code. The patterns of Domain-Driven Design become classes you
extend, a shared layout tells everyone where things go, and a check run in continuous integration
reports what breaks them. It works the same for a developer who knows DDD and for an agent that
has never heard of it.

### Write the domain with building blocks

```ts [order.aggregate.ts]
// [!code word:AggregateRoot]
import { AggregateRoot } from "@alveolus/core";

export class Order extends AggregateRoot<OrderId> {}
```

```ts [place-order.command.ts]
// [!code word:CommandHandler]
import { CommandHandler } from "@alveolus/core";

export class PlaceOrderHandler extends CommandHandler<PlaceOrder, OrderPlaced, PlaceOrderError> {}
```

### Check it on every run

```sh
$ npx alveolus arch check
src/ordering/domain/aggregates/order.aggregate.ts:1
  layers/no-impure-domain: The domain imports @nestjs/common: add it
  to domainDependencies if the domain really needs it.

src/ordering/application/commands/place-order.command.ts:3
  layers/no-outward-import: The application layer imports
  src/ordering/driven/pg/adapters/pg-orders.adapter.ts
  (ordering driven): it may only import domain,
  application, published-language.

2 violations
```

## Two packages

<div class="al-packages">

<a class="al-package" href="./core/">
	<span class="al-package-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3zM7 16.5l-4.74-2.85M7 16.5l5-3m-5 3v5.17m5-8.17V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5zm5 3l-5-3m5 3l4.74-2.85M17 16.5v5.17"/><path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3l5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0zM12 8L7.26 5.15M12 8l4.74-2.85M12 13.5V8"/></g></svg></span>
	<span class="al-package-name">@alveolus/core</span>
	<span class="al-package-text">The building blocks: aggregates, entities, value objects, domain events and errors, ports and repositories, command and query handlers, the outbox, Result. No runtime dependency.</span>
	<span class="al-package-link">Building blocks →</span>
</a>

<a class="al-package" href="./rules/">
	<span class="al-package-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12l2 2l4-4"/></g></svg></span>
	<span class="al-package-name">@alveolus/arch</span>
	<span class="al-package-text">The architecture checks: rules that keep bounded contexts closed, the domain pure and every class in its place. A command for your terminal and your CI, with a baseline for existing projects.</span>
	<span class="al-package-link">Rules →</span>
</a>

</div>

## Start in a minute

::: code-group

```sh [pnpm]
pnpm add @alveolus/core
pnpm add -D @alveolus/arch
```

```sh [npm]
npm install @alveolus/core
npm install -D @alveolus/arch
```

```sh [yarn]
yarn add @alveolus/core
yarn add -D @alveolus/arch
```

```sh [bun]
bun add @alveolus/core
bun add -d @alveolus/arch
```

:::

Then describe your bounded contexts in `alveolus.config.ts` and run `npx alveolus arch check`:
[Getting started](./guide/getting-started.md) walks through it.

</div>
