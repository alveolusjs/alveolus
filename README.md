# Alveolus

Domain-Driven Design for TypeScript: rules to read and review code, the building blocks to write it, and the tools to build any app with them. Nothing here knows a particular app.

The rules are on [alveolus.dev](https://alveolus.dev/), in French. Start with [getting started](https://alveolus.dev/start/getting-started).

## Use it in an app

```sh
pnpm add @alveolus/core
pnpm add -D @alveolus/claude-rules
pnpm exec alveolus-claude install
```

| Package | What it is |
| --- | --- |
| [`@alveolus/core`](https://www.npmjs.com/package/@alveolus/core) | The building blocks of DDD for TypeScript, with no runtime dependency |
| [`@alveolus/claude-rules`](https://www.npmjs.com/package/@alveolus/claude-rules) | Installs in an app the approved rules as Claude Code path-scoped rules, and the skills to design, implement and review a user story with them |

The Claude Code plugin `alveolus` comes from this repository, which is its marketplace (`.claude-plugin/marketplace.json`, name `harness`):

```
/plugin marketplace add alveolusjs/alveolus
/plugin install alveolus@harness
```

An app opts in to the plugin with a `harness.md` at its root.

## Inside the repository

| Folder | What it is |
| --- | --- |
| `docs/` | The Alveolus site: the DDD and architecture rules, a VitePress site published at [alveolus.dev](https://alveolus.dev/): `pnpm docs:dev` |
| `packages/core/` | `@alveolus/core`, published on npm |
| `packages/claude-rules/` | `@alveolus/claude-rules`, published on npm |
| `packages/fitness-functions/` | `@alveolus/fitness-functions`, published on npm: the checks of an app against the rules, run from its tests |
| `packages/claude-plugin/` | The Claude Code plugin `alveolus`: skills to build an app slice by slice from its product documentation, and a reviewer agent |
| `packages/context-mapper/` | Validates a context map written in CML and draws it, with the Context Mapper CLI in Docker |

```sh
pnpm install
pnpm docs:dev
```

[CONTRIBUTING.md](./CONTRIBUTING.md) says how to contribute, and how a change reaches npm.
