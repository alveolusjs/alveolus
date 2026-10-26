# alveolus plugin

A Claude Code plugin, `alveolus`, to build an app slice by slice from its product documentation, within the Alveolus rules. It knows nothing of any app: each app opts in with a `harness.md` at its root.

## Use it

In this repository, `.claude/settings.json` registers the repository as the marketplace `harness` and enables the plugin, once the folder is trusted, from the next session. In an app's repository, add the marketplace from GitHub:

```
/plugin marketplace add alveolusjs/alveolus
/plugin install alveolus@harness
```

Check the plugin with `claude plugin validate ./packages/claude-plugin`. Edits apply at the next session or after `/reload-plugins`.

## Bricks

| Brick | What it does | Since |
| --- | --- | --- |
| `harness.md` contract | An app says where its documentation, catalog, slices and rules are, how to read an entry, how an entry ships, its checks and its conformance test | 0.1 |
| `/alveolus:spec` | Writes `spec.md` from the documentation, doc-first | 0.1 |
| `/alveolus:design` | Writes `design.md`, naming the rules it applies | 0.1 |
| `/alveolus:tasks` | Writes `tasks.md`, test first | 0.1 |
| `/alveolus:build` | Builds one task at a time, test seen failing first | 0.1 |
| `/alveolus:verify` | Runs the checks and the reviewer, then ships the entries | 0.1 |
| `alveolus:reviewer` agent | Reviews a change against the rules | 0.1 |

The user runs each skill and reviews between steps. A spec moves through `draft`, `approved`, `designed`, `planned`, `building`, `done`.

## `harness.md`

Frontmatter: `app`, `rules`, `architecture`, `styles` (the file that gives each context its style, `tactical` or `transaction-script`), `conventions`, `documentation`, `slices`, `plan`, `conformance`, `fastChecks`, `fullChecks`. Body, one section each: Catalog (where entries are declared, their statuses, how one ships), Reading guide, Doc-first signals, Business rules, Conformance, Styles (the style of each context, and which rules to load), Building blocks.

## Next bricks

Candidates, added one at a time when a slice shows the need:

- a `/alveolus:review` skill to run the reviewer on any diff, outside a slice;
- a hook that refuses shipping an entry while the conformance check fails;
- a check that `harness.md` declares every field the skills read;
- a `/alveolus:init` skill that drafts `harness.md` for a new app.
