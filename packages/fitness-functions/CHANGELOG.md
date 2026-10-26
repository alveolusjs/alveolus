# @alveolus/fitness-functions

## 0.1.0

### Minor Changes

- 10c9e26: Read the bounded contexts and their style from `architecture.json`, check each rule only on the bounded contexts of its styles, and throw instead of passing on a project the fitness functions cannot read.
- 9447743: Each rule says what its fitness function covers: `fitness.rule(code)` gives its `coverage`, `full` or `partial`, and one sentence on what it `checks`.
- fc5aa5d: Add the package and its first fitness function, LAY-04: another bounded context comes in through `public` only.
- a73a969: Read waivers: a `// waiver LAY-04: <reason>` comment covers a violation of its rule on its line or the line below. `check(code)` leaves it out, `waivers(code)` lists it with its reason, and `check(code)` reports a waiver that gives no reason or covers no violation.
