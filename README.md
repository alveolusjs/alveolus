# Alveolus

Domain-Driven Design for TypeScript: rules to read and review code, the building blocks to write it, and the tools to build any app with them. Nothing here knows a particular app.

## Docs

| Folder | What it is |
| --- | --- |
| `docs/` | The Alveolus site: the DDD and architecture rules, a VitePress site meant to be published publicly: `pnpm docs:dev` |

## Packages

| Folder | What it is |
| --- | --- |
| `packages/core/` | `@alveolus/core`: the building blocks of DDD for TypeScript, with no runtime dependency |
| `packages/claude-rules/` | `@alveolus/claude-rules`: installs in an app the approved rules as Claude Code path-scoped rules, and the skills to design, implement and review a user story with them |
| `packages/claude-plugin/` | The Claude Code plugin `alveolus`: skills to build an app slice by slice from its product documentation, and a reviewer agent |
| `packages/context-mapper/` | Validates a context map written in CML and draws it, with the Context Mapper CLI in Docker |

The repository is the marketplace of its plugins (`.claude-plugin/marketplace.json`, name `harness`). An app opts in to the `alveolus` plugin with a `harness.md` at its root.

```sh
pnpm install
pnpm docs:dev
```
