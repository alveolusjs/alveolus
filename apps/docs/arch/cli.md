# CLI

```sh
alveolus arch check [--project <tsconfig.json>]
```

Reads `./tsconfig.json`, or the file given with `--project`, and analyses the files of that project
under `src/`. Run it in CI next to your tests.

```
src/ordering/domain/aggregates/order.aggregate.ts:12:3  aggregate/reference-by-identity
  Order references aggregate Customer; reference it by its identifier instead.

✖ 1 violation
```

| Exit code | Meaning                                  |
| --------- | ---------------------------------------- |
| `0`       | No violation.                            |
| `1`       | At least one violation.                  |
| `2`       | Invalid arguments or tsconfig not found. |

## API

```ts
function check(options?: { project?: string }): Violation[]
```

The same check from code. Each violation has a `rule`, a `message`, a `file`, a `line` and a
`column`.

```ts
import { check } from "@alveolus/arch";

const violations = check({ project: "tsconfig.json" });
```

## See also

- [Project layout](./project-layout.md) and the [rules](./index.md#rules) it checks
