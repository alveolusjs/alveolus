# @alveolus/claude-rules

The [Alveolus](https://alveolus.dev/) rules for Claude Code, installed in an app:

- its approved rules as [path-scoped rules](https://code.claude.com/docs/en/memory#path-specific-rules), one file per scope and style in `.claude/rules/alveolus/`. Claude Code loads each file only when it reads or edits a file of that scope: the rules of `domain` when it works in `src/wallets/domain/`, those of `driven` in `src/wallets/driven/`;
- three skills that take a user story from design to review, and a reviewer agent.

The site walks through it in [getting started](https://alveolus.dev/start/getting-started#claude-code).

## From a user story to a review

| Step | Run | What it does | Design `status` after |
| --- | --- | --- | --- |
| Design | `/alveolus-design <story>` | Reads the story, the code and the rules of each folder it touches, and writes `docs/designs/<slug>.md`: acceptance criteria, model, use cases, adapters, persistence, files, tests, rules applied, open questions. No code. | `draft`, then `approved` by the user |
| Implement | `/alveolus-implement <design>` | Only from an `approved` design. Test first, criterion by criterion, inside out, reading each folder's rules before writing in it. Stops on a gap in the story or the design, or a rule it cannot keep. | `implemented` |
| Review | `/alveolus-review [design]` | Runs the app's checks, has the `alveolus-reviewer` agent check the rules on the changed files, and checks the code against the design and its criteria. Fixes nothing. | `reviewed`, once the user accepts the verdict |

The user reviews between steps: each skill runs only when invoked, never on its own. Designs go to `docs/designs/` unless the app's CLAUDE.md names another folder.

## Use it in an app

The app declares its bounded contexts and their style in `architecture.json` (CTX-14), and its big balls of mud (MAP-04):

```json
{
	"contexts": {
		"wallets": "tactical",
		"notifications": "transaction-script",
		"legacy": "big-ball-of-mud"
	}
}
```

A context lives in `src/<context>/`. When it lives elsewhere, the long form gives its folder: `"legacy": { "style": "big-ball-of-mud", "path": "apps/back-office/src" }`.

Then:

```sh
pnpm add -D @alveolus/claude-rules
pnpm exec alveolus-claude install
```

Run `install` again after each update of the package, or after adding a bounded context. It replaces `.claude/rules/alveolus/`, the skills `alveolus-*` of `.claude/skills/` and the agent `.claude/agents/alveolus-reviewer.md`: never edit those files by hand. Commit them, so that every session of the team loads the same rules.

| Option | Default | What it sets |
| --- | --- | --- |
| `--architecture <file>` | `architecture.json` | Bounded contexts and their style |
| `--src <dir>` | `src` | Folder holding one folder per bounded context |
| `--prisma <dir>` | `prisma` | Folder holding one Prisma schema per bounded context |

## What it writes

| Scope | Files it matches, for each bounded context |
| --- | --- |
| `domain` | `src/<context>/domain/**`, tactical contexts only (TXS-05) |
| `application`, `driving`, `driven`, `public` | `src/<context>/<layer>/**` |
| `schema` | `prisma/<context>.prisma` |
| `tests` | `src/<context>/**/__test__/**`, `*.spec.ts`, `*.test.ts` |
| `structure` | `src/<context>/*.ts`: module, config, wiring |

A big ball of mud gets no layer rules: it has no layers. Its own file, `big-ball-of-mud.<context>.md`, matches its whole folder and keeps it contained: fix it at the minimum, never model it, and propose a bounded context of its own for a feature that deserves one (MAP-04). The index lists every big ball of mud, so that code elsewhere reads it only through an anticorruption layer in `driven`. A big ball of mud outside the project, at a `path` starting with `..` or absolute, is only listed.

Each rule keeps its Signal, Exceptions, Correction, Adaptation and Example. Its Why and Related sections are left out to save context. Only approved rules are shipped: a rule still to review, or rejected, stays out until its verdict is `approved`. A rule whose detection is `fitness` stays in: Claude follows it while writing, the tooling checks it after.

`index.md` has no `paths`, so it is loaded at the start of every session. A new file only loads its rules after it is written: the index tells Claude which file of rules to read before creating a file in each folder.

## Build it

`pnpm build` turns the rules of `docs/src/rules/` into `generated/rules.json`, the only data the command reads. The skills live in `skills/`, the agent in `agents/`, copied as they are. To try a change in an app before publishing, install the package with `pnpm add -D link:<path to this folder>`.

The package ships the approved rules: a pull request that changes an approved rule, or approves one, adds a changeset for `@alveolus/claude-rules`, so that the rules reach npm.

Node.js 24 or later. MIT.
