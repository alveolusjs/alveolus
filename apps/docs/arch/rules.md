# Architecture rules

`alveolus arch check` enforces four families of rules.

## Layer dependencies

Within a bounded context:

| Layer         | May import                          |
| ------------- | ----------------------------------- |
| `domain`      | `domain`, `@alveolus/core`          |
| `application` | `domain`, `application`             |
| `driven`      | `domain`, `application`             |
| `driving`     | `application`                       |

`driven` and `driving` never import each other.

## Building-block rules

- Value objects are immutable.
- Entities have no public setters.
- Domain event names are in the past tense.
- An aggregate references another aggregate only by its identifier.
- Repository ports in `domain` are interfaces.

## Bounded-context isolation

A bounded context imports another one only through its `index.ts`, never its internals.

## Naming and placement

Ports live in `domain` or `application`; their implementations live in `driven`. Building blocks
sit in the layer they belong to.
