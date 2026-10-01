<script setup>
import { withBase } from "vitepress";
</script>

# Introduction

Alveolus is a set of TypeScript packages for building business software with Domain-Driven
Design: base classes for your domain model, helpers to test it, and checks that keep it in shape.

::: warning Early preview
Packages are not published on npm yet and APIs may change. The [vocabulary](./vocabulary.md) shows
what is available and what is planned.
:::

## Why

Every codebase starts with a clear design. Then come deadlines, new people and quick fixes that
work. Aggregates start holding each other, business rules move into controllers, the domain reads
the clock and calls the database. Nothing fails. The code just gets harder to change.

Coding agents speed this up. They solve the task in front of them, do not remember the decisions
behind your architecture, and rarely refuse a shortcut that works.

Alveolus turns those decisions into code and checks, so they hold whoever writes the next change.

## Benefits

- **A shared vocabulary.** Alveolus speaks the language of Domain-Driven Design, from
  [bounded contexts](./vocabulary.md#strategic-design) to
  [aggregates](./vocabulary.md#tactical-design) and
  [application services](./vocabulary.md#application).
- **A model you can read.** A class that extends `AggregateRoot` is an aggregate: the structure of
  the domain is visible in the code.
- **Rules that hold.** The type system and [`alveolus arch check`](/arch/) reject code
  that breaks the rules, whoever wrote it.
- **A predictable domain.** No clock, no I/O, failures returned as values: behaviour depends only
  on inputs.
- **No lock-in.** No framework, container, bus or ORM. `@alveolus/core` has no runtime
  dependencies.
- **Ready for agents.** The docs are available at
  [`llms.txt`](https://alveolusjs.github.io/alveolus/llms.txt), and every violation says what to
  change.

## Packages

<div class="al-packages">
  <a class="al-package" :href="withBase('/core/')">
    <span class="al-package-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3zM7 16.5l-4.74-2.85M7 16.5l5-3m-5 3v5.17m5-8.17V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5zm5 3l-5-3m5 3l4.74-2.85M17 16.5v5.17"/><path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3l5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0zM12 8L7.26 5.15M12 8l4.74-2.85M12 13.5V8"/></g></svg></span>
    <span class="al-package-name">@alveolus/core</span>
    <span class="al-package-text">The building blocks of your domain model. No runtime dependencies.</span>
    <span class="al-package-apis">Entity · ValueObject · AggregateRoot</span>
    <span class="al-package-link">Read the docs →</span>
  </a>
  <a class="al-package" :href="withBase('/testing/')">
    <span class="al-package-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2M6.453 15h11.094M8.5 2h7"/></svg></span>
    <span class="al-package-name">@alveolus/testing</span>
    <span class="al-package-text">Test the model through its behaviour, with any test runner.</span>
    <span class="al-package-apis">given · thenSucceeded · thenRecorded</span>
    <span class="al-package-link">Read the docs →</span>
  </a>
  <a class="al-package" :href="withBase('/arch/')">
    <span class="al-package-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12l2 2l4-4"/></g></svg></span>
    <span class="al-package-name">@alveolus/arch</span>
    <span class="al-package-text">Check the code against the rules and stop drift in CI.</span>
    <span class="al-package-apis">alveolus arch check</span>
    <span class="al-package-link">Read the docs →</span>
  </a>
</div>

## Next

- [Getting started](./getting-started.md): build, test and check a first aggregate.
- [Vocabulary](./vocabulary.md): every term, and where it stands in Alveolus.
