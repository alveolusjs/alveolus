# @alveolus/arch

Architecture tests for codebases built with `@alveolus/core`. It analyses your TypeScript sources
with [ts-morph](https://ts-morph.com) and reports every violation of the Alveolus rules.

Building blocks are recognised **by inheritance**: any class extending `ValueObject`,
`AggregateRoot` and so on is checked against the rules of that building block.

## Installation

::: code-group

```sh [pnpm]
pnpm add -D @alveolus/arch
```

```sh [npm]
npm install -D @alveolus/arch
```

```sh [yarn]
yarn add -D @alveolus/arch
```

```sh [bun]
bun add -D @alveolus/arch
```

:::

## Usage

Run the checks from the root of your project, typically in CI:

```sh
alveolus arch check
```

Your sources must follow the [project layout](/guide/project-layout). The layout is not
configurable.

## Contents

- [Rules](./rules.md): every rule checked by the CLI.
