---
description: "What a version number of @alveolus/core and @alveolus/arch promises: what changes in a patch, a minor and a major, and how to update."
---

# Versioning

Both packages follow [semantic versioning](https://semver.org/), with the same version number,
released together. The changelog of each package says what changed and why; read it before you
update, the way you would read the notes of a linter.

## Before 1.0

A `0.x` version can change between minors: a rule renamed, a configuration key moved, a message
reworded. Each change is in the changelog, with what to do. `1.0.0` comes when a project has
lived on the checks long enough to trust them, on Linux, macOS and Windows.

## From 1.0

| Change | Version |
| --- | --- |
| A bug fixed, a message reworded, a page corrected | patch |
| A new rule, **reported as an error from its first version** | minor |
| A new configuration key, a new output format, a new option | minor |
| A rule that reports more than before, on code it accepted | minor, said in the changelog |
| A rule renamed or removed, a configuration key renamed or removed | major |
| A building block whose signature changes, a type removed from `@alveolus/core` | major |
| A higher Node.js version required | major |

A rule keeps its id for as long as it exists: there is no alias. When an id has to change, it
changes at a major, and the changelog gives the old and the new name.

## Update

A minor can add a rule that fails your check: that is the point of a rule. Read the changelog,
run `npx alveolus arch check`, and either fix what it reports, lower the rule to `warn` for a
while, or record it in the baseline. A major comes with migration notes in its changelog.

## See also

- [Getting started](./getting-started.md), the configuration and the levels of the rules
- [The changelog of `@alveolus/arch`](https://github.com/alveolusjs/alveolus/blob/main/packages/arch/CHANGELOG.md)
  and [of `@alveolus/core`](https://github.com/alveolusjs/alveolus/blob/main/packages/core/CHANGELOG.md)
