# Changesets

A pull request that changes a package adds a file here: `pnpm changeset`, pick the package, the
bump (patch, minor, major) and write one line a user can read. On `main`, the release workflow
collects these files into a "Version packages" pull request that updates the versions and the
changelogs; merging it publishes to npm with provenance.

What is a breaking change is written in the documentation, under Versioning.
