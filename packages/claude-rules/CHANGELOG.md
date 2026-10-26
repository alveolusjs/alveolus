# @alveolus/claude-rules

## 0.2.1

### Patch Changes

- 1a1e8b3: UC-02 and UC-07 say how `driving` turns a refusal into an HTTP status: by its `type`, without importing `domain`.
- 189d8fa: Drop the detection mode from the rules: each rule now carries an empty `detection` list, filled when a check automates it, one rule at a time.

## 0.2.0

### Minor Changes

- 22ac859: The design cuts a user story into small increments, one pull request each, that merge on their own without breaking anything: `/alveolus-implement` builds one increment per run on its own branch, and `/alveolus-review` checks it before its pull request.
- f8f6e51: `install` writes one folder per style (`tactical/domain.md`, `transaction-script/driven.md`, `big-ball-of-mud/<context>.md`), each rules file starts with its contents and groups its rules by theme, and the index lists each bounded context with the count and themes of its rules files.

### Patch Changes

- 6da206c: The npm page shows the license, the repository and the site, and the package declares Node.js 24 or later.
