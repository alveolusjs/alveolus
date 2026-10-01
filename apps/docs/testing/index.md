# @alveolus/testing

Helpers to test a domain model through its behaviour. They throw a Node.js `AssertionError`, so
they work with Vitest, Jest and `node:test`, and test runners show a diff on payload mismatches.

## Installation

::: code-group

```sh [pnpm]
pnpm add -D @alveolus/testing
```

```sh [npm]
npm install -D @alveolus/testing
```

```sh [yarn]
yarn add -D @alveolus/testing
```

```sh [bun]
bun add -D @alveolus/testing
```

:::

`@alveolus/core` is a peer dependency.

## Helpers

| Page                                              | Helpers                                         |
| ------------------------------------------------- | ----------------------------------------------- |
| [Scenarios](./scenarios.md)                       | `given`, `when`, `thenSucceeded`, `thenFailedWith`, `thenRecorded`, `thenRecordedNothing` |
| [Event assertions](./event-assertions.md)         | `assertRecorded`, `assertRecordedNothing`       |

Everything is exported from `@alveolus/testing`, and from `@alveolus/testing/scenarios` and
`@alveolus/testing/event-assertions`.
