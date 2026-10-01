# Project layout

The architecture tests assume one fixed layout. Each bounded context lives in its own folder
under `src/` and is split into four layers.

```
src/
  <bounded-context>/
    index.ts          # public API of the bounded context
    domain/           # aggregates, entities, value objects, events, Repository ports
    application/      # use cases and technical ports (mailer, clock, payment gateway…)
    driven/           # secondary adapters: implement ports (database, HTTP clients, queues)
    driving/          # primary adapters: call use cases (HTTP controllers, CLI, consumers)
```

## Example

```
src/ordering/
  index.ts
  domain/
    order.ts
    order-repository.ts        # port
  application/
    place-order.ts             # use case
    payment-gateway.ts         # port
  driven/
    pg-order-repository.ts
    stripe-payment-gateway.ts
  driving/
    http/order-controller.ts
```

## Where do ports go?

- **Repository ports** belong to the domain: `domain/order-repository.ts`.
- **Technical ports** (sending emails, reading the clock, charging a card) belong to the
  application layer: `application/payment-gateway.ts`.
- Their implementations live in `driven/`.
