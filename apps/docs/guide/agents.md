---
description: "Give Claude Code, Cursor or Codex the Alveolus documentation offline: npx alveolus init writes a skill and AGENTS.md, npx alveolus explain prints any page in the terminal."
---

# Coding agents

An agent that writes code in your project needs the same two things as a new teammate: what each
building block is for, and what a rule reports and how to fix it. Both are installed with
`@alveolus/arch`, so the agent reads them in the terminal rather than on the web, and reads the
page of the version it has.

<dl class="al-glance">
	<dt>Read a page</dt><dd><code>npx alveolus explain &lt;topic&gt;</code>: a rule id, a building block or a guide</dd>
	<dt>List the topics</dt><dd><code>npx alveolus explain</code></dd>
	<dt>Tell the agent</dt><dd><code>npx alveolus init</code> writes <code>.claude/skills/alveolus/SKILL.md</code> and a section of <code>AGENTS.md</code></dd>
</dl>

## Read the documentation in the terminal

Every page of this site, except the home page, ships in the package under `docs/`:

```sh
npx alveolus explain layers/no-impure-domain   # a rule, by the id the report prints
npx alveolus explain aggregates                # a building block
npx alveolus explain project-layout            # a guide
npx alveolus explain rules                     # an overview, by its folder
npx alveolus explain                           # every topic
```

A name matches the end of a topic: `no-impure-domain`, `layers/no-impure-domain` and
`rules/layers/no-impure-domain` print the same page. When a name matches several pages, the
command lists them.

The report of `alveolus arch check` ends with the command, so an agent that reads a violation
knows where the fix is written:

```
src/ordering/domain/aggregates/order.aggregate.ts
  12  error  layers/no-impure-domain: The domain reads the system clock with
      Date.now: receive the time from the Clock port.

1 error in 142 files

Why, and how to fix it: npx alveolus explain <rule>
```

## Tell the agent where to look

Nothing in `node_modules` is read by an agent on its own: the project has to say so. `npx alveolus
init` writes two short files, and leaves alone any that exists:

| File | Read by | What it says |
| --- | --- | --- |
| `.claude/skills/alveolus/SKILL.md` | Claude Code, and any tool that follows the [Agent Skills](https://agentskills.io) format | Read the building block before writing a class, run the checks after each change, read the rule before fixing a violation, never silence a rule without asking. |
| `AGENTS.md`, a section | Cursor, Codex, Copilot, Claude Code when there is no `CLAUDE.md` | The same, in a paragraph, with a pointer to the skill. |

The skill is a map, not the documentation: ten lines that say which command to run and when. The
pages stay in the package, so they follow its version and never load into the agent's context
unless it needs one.

If the project has a `CLAUDE.md`, Claude Code reads it instead of `AGENTS.md`: add a line with
`@AGENTS.md` to it, and `init` reminds you.

## See also

- [Getting started](./getting-started.md), the configuration and the checks
- [Rules](../rules/index.md), what each one reports
- [Learning path](./learning-path.md), the order in which to read the docs
