# Changesets

A pull request that changes a package adds a file here: `pnpm changeset`, pick the package, the
bump (patch, minor, major) and write one line a user can read. On `main`, the release workflow
collects these files into a "Version packages" pull request that updates the versions and the
changelogs; merging it publishes to npm with provenance.

`@alveolus/claude-rules` ships the approved rules of `docs/src/rules/`: a pull request that changes
an approved rule, or approves one, adds a changeset for it, even when no file of the package changes.
