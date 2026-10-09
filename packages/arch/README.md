# @alveolus/arch

Architecture checks for a Domain-Driven Design project in TypeScript: bounded contexts stay
closed, the domain stays pure, every class stays in its place, and the drift is reported before
the review.

```sh
pnpm add -D @alveolus/arch
```

```ts
// alveolus.config.ts
import { defineConfig } from "@alveolus/arch";

export default defineConfig({
	boundedContexts: { catalog: "catalog", notifications: "notifications", ordering: "ordering" },
	root: "src",
	subdomains: { core: ["catalog", "ordering"], generic: ["notifications"] },
});
```

```sh
npx alveolus arch check
```

```
src/ordering/domain/aggregates/order.aggregate.ts
  12  error  layers/no-impure-domain: The domain reads the system clock with
      Date.now: receive the time from the Clock port.

1 error in 142 files
```

Seventeen rules, each with a page that says what it reports, why, how to fix it and what it
cannot see. A baseline for existing projects, `error` / `warn` / `info` levels, disable comments
with a reason, JSON and SARIF output for the pull request.

The documentation is installed with the package, for you and for a coding agent:
`npx alveolus explain layers/no-impure-domain` prints a rule, `npx alveolus explain aggregates` a
building block, and `npx alveolus init` writes the configuration and the instructions that tell
Claude Code, Cursor or Codex to read them there.

- [Rules](https://alveolus.dev/rules/)
- [Getting started](https://alveolus.dev/guide/getting-started)
- [Adopt it on an existing project](https://alveolus.dev/guide/existing-project)
- [Coding agents](https://alveolus.dev/guide/agents)

Node.js 24 or later. MIT.
