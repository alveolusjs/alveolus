---
description: "Adopt the Alveolus architecture checks on an existing TypeScript project, context by context, without stopping the team."
---

# Adopt it on an existing project

An existing project rarely has bounded contexts, layers and building blocks already. The checks
can still start today: record what is, choose what to fix first, and move one context at a time.
Nothing here requires a rewrite.

<dl class="al-glance">
	<dt>Time to the first green check</dt><dd>An hour</dd>
	<dt>Tools</dt><dd>The baseline, the levels of the rules, <code>layout.extraFolders</code>, <code>ignore</code></dd>
	<dt>Order</dt><dd>Declare, record, lower, raise, move</dd>
</dl>

## 1. Declare what exists

Name the bounded contexts as the code has them today, even when they are folders named
`modules/orders` or `features/billing`: `boundedContexts` takes any folder under `root`. Leave the
context map for later. Put under `ignore` what has nothing to do with the architecture: scripts,
generated code, migrations.

```ts [alveolus.config.ts]
export default defineConfig({
	boundedContexts: { billing: "features/billing", orders: "modules/orders" },
	ignore: ["src/migrations/**", "src/generated/**"],
	root: "src",
});
```

Run `npx alveolus arch check`: it fails, and the number of violations is your starting point.

## 2. Record the baseline

`npx alveolus arch baseline` writes every current violation to `alveolus.baseline.json`. Commit
it: from now on, `check` fails only on what is new. The team keeps shipping, and the baseline
can only shrink: `baseline` refuses to grow unless asked to.

## 3. Lower what you will not fix yet

A rule that reports hundreds of violations the team will fix over months goes to `warn`: it keeps
reporting, without failing the check. A rule that does not fit a part of the project yet goes to
`info`, or `off` with a date to come back.

```ts [alveolus.config.ts]
rules: {
	"tactical/no-public-field": "warn",
	"tactical/no-thrown-failure": "warn",
	"layers/no-outward-import": "info",
},
```

Keep as errors, from day one, the rules that stop the worst: `strategic/no-cross-context-import`,
`layers/no-impure-domain`, `tactical/no-aggregate-reference`. New code follows them; old code is
in the baseline.

## 4. Keep the folders you have

Folders that will stay, such as `domain/specifications/` or `application/dto/`, go in
`layout.extraFolders`. Folders that will go stay reported, in the baseline.

## 5. Move one context

Pick the context the team touches most. In this order, each step leaving the check green:

| Step | Rules that go green | What moves |
| --- | --- | --- |
| Layers | `layers/no-outward-import`, `layers/no-driving-shortcut` | Files into `domain/`, `application/`, `driven/<technology>/`, `driving/<technology>/`; controllers call handlers. |
| Purity | `layers/no-impure-domain`, `layers/no-portless-adapter` | Framework and database out of the domain, behind ports. |
| Building blocks | `tactical/no-loose-code`, `tactical/no-misplaced-class`, `tactical/no-public-field` | Each class extends its block, in its folder, with its state private. |
| Behaviour | `tactical/no-thrown-failure`, `tactical/no-foreign-*-dependency` | Failures as `Result`, handlers receive what they should. |
| Boundaries | `strategic/*` | Open host services, anti-corruption layers, the context map. |

After each step, `npx alveolus arch baseline` drops what is fixed, and the `fixed` count in the
summary tells the team how far it got.

## 6. Raise the levels

When a rule reports nothing for the contexts already moved, it goes back to `error`. When every
context is moved, delete the baseline.

## What to expect

- The first `check` on a large project reports a lot: that is the point of the baseline. Read
  the counts per rule in `--format json` before deciding what to lower.
- A rule reported where the team disagrees with it is a conversation, not a `disable`: lower it,
  write why in the configuration, and come back to it.
- `--format sarif` in the pull requests shows new violations where they are written, which is
  what keeps the baseline from growing again.

## See also

- [Getting started](./getting-started.md), the configuration and the commands
- [Project layout](./project-layout.md), where things end up
- [Rules](../rules/index.md), what each one reports and what it cannot see
