# @alveolus/testing

Test helpers for codebases built with `@alveolus/core`.

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

## Planned helpers

- **In-memory repositories**: a ready-made implementation of the `Repository` port to test use
  cases without a database.
- **Fakes** for common technical ports, such as a controllable clock.
- **Matchers** to assert on `Result` values and on the domain events pulled from an aggregate.
