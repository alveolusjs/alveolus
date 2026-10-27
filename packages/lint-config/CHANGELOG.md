# @alveolus/lint-config

## 0.2.0

### Minor Changes

- cf56a9e: Breaking: the oxlint config is replaced by an ESLint config, `@alveolus/lint-config/eslint`, which needs `eslint` and `typescript-eslint`. Replace `oxlint.config.mts` with an `eslint.config.mjs` that spreads it, and `oxlint-disable` waivers with `eslint-disable`.
- cf56a9e: Add a dependency-cruiser reporter that prints each violation as oxlint does: the rule, the import framed in its file, and the url of the rule (`--output-type plugin:@alveolus/lint-config/dependency-cruiser-reporter`). An ESLint formatter prints its messages the same way (`--format ./node_modules/@alveolus/lint-config/eslint-formatter.mjs`). The titles of the rules in every message are in English.
- cf56a9e: Check UC-11 and NAM-09: a `Result` dropped as a statement, a variable nothing reads, a promise never awaited, and a parameter property. LAY-04, LAY-01 and PUB-01 are checked by ESLint, in the editor; dependency-cruiser keeps LAY-02.

## 0.1.0

### Minor Changes

- 070c526: Add the package: configs for oxlint and dependency-cruiser that check LAY-04, LAY-02, LAY-01, PUB-01, CTX-06, WIR-05 and PLC-07 without false positives, each message giving the code, title and url of its rule.
