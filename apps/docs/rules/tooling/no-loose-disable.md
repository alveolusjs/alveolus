---
description: "Architecture rule: a disable comment names a rule and gives a reason, and is removed once the line below breaks the rule no more."
---

# no-loose-disable

A disable comment turns one violation off, says which rule and why, and goes away with the
violation.

<dl class="al-glance">
	<dt>Rule</dt><dd><code>tooling/no-loose-disable</code></dd>
	<dt>Category</dt><dd><a href="/rules/#tooling">Tooling</a>: how the checks themselves are used</dd>
	<dt>Reports</dt><dd>A <code>// alveolus-disable-next-line</code> comment that names no known rule, gives no reason, or disables nothing</dd>
	<dt>Applies to</dt><dd>Every analysed file</dd>
	<dt>Turn off</dt><dd><a href="#turn-it-off"><code>"tooling/no-loose-disable": "off"</code></a></dd>
</dl>

## Why

A violation is sometimes right to keep for a while: a legacy import that a ticket will remove, a
rule that does not fit one file yet. A comment above the line turns it off, where a reviewer sees
it. Without a rule and a reason, the comment says nothing, and once the line is fixed it stays
behind and hides the next violation.

::: tip The fix
Write the rule and the reason: `// alveolus-disable-next-line layers/no-impure-domain: legacy pool, ORD-412`.
When the line breaks the rule no more, the comment is reported until it is removed.
:::

## What it checks

Every `// alveolus-disable-next-line` comment:

<div class="al-cards al-cards-2">
<div class="al-card"><span class="al-card-title"><span class="al-card-step">1</span>Names a rule</span>The id of a rule, as the rules page lists it. One rule per comment.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">2</span>Gives a reason</span>After a colon: why this line keeps its violation. Free text, read in review.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">3</span>Turns something off</span>The line below breaks that rule. A comment that disables nothing is reported.</div>
<div class="al-card"><span class="al-card-title"><span class="al-card-step">4</span>Is counted</span>The summary says how many violations are disabled, and <code>--format json</code> lists them with their reason.</div>
</div>

A comment that names no rule, an unknown rule, or no reason disables nothing: the violation below
is reported as well.

## What it reports

```
src/ordering/domain/services/pricing.service.ts
  1  tooling/no-loose-disable: The disable comment gives no reason:
     write `// alveolus-disable-next-line layers/no-impure-domain:
     <why this line keeps its violation>`.
  4  tooling/no-loose-disable: The disable comment disables nothing:
     the line below breaks layers/no-impure-domain no more; remove
     the comment.
```

## Fix it

### Say which rule, and why

<div class="al-compare">

```ts [❌ Avoid: src/ordering/domain/services/pricing.service.ts]
// alveolus-disable-next-line
import { Pool } from "pg";
```

```ts [✅ Prefer: src/ordering/domain/services/pricing.service.ts]
// alveolus-disable-next-line layers/no-impure-domain: legacy pool, removed with ORD-412
import { Pool } from "pg";
```

</div>

### Remove the comment with the violation

Once the line is fixed, the comment is reported: delete it. A disable comment never outlives what
it disables.

## Limits

::: warning What the rule cannot see
- Whether the reason is a good one: `: because` passes. The reason is for the reviewer.
- A violation turned off is still a violation: for a whole file or a whole rule, prefer `ignore`
  or `rules` in `alveolus.config.ts`, and for the past, the baseline.
:::

## Turn it off

```ts [alveolus.config.ts]
rules: { "tooling/no-loose-disable": "off" },
```

Disable comments then still work, but nothing checks them.

## See also

- [Getting started: turn a violation off](../../guide/getting-started.md#turn-a-violation-off)
- [Rules](../index.md), every rule by category
