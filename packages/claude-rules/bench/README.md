# Design bench

Measures `/alveolus-design` on six tickets against a small app, so that a change to the design skill, or the agents behind it, is compared on the same ground. It is not part of the published package, and it does not run in CI: each run spends real tokens.

| Folder or file | What it holds |
| --- | --- |
| `app/` | A small banking app: `wallets` (tactical) and `notifications` (transaction script), with no deposit yet |
| `tickets/` | Two tasks, two stories, two epics, in French and in English, as a product team writes them |
| `rubric.md`, `verdict.schema.json` | What the judge grades, from 0 to 1: fidelity, questions, rules, reuse, coherence, proportion, readability; and its verdict |
| `run.ts`, `runner/` | The runner |
| `results/<label>/` | One folder per ticket (`design.md`, `response.md`, `outcome.json`) and `summary.md` |

## Run it

From `packages/claude-rules`, with the `claude` CLI signed in:

```sh
pnpm build
node bench/run.ts --label <name> [--tickets story-deposit,epic-savings-goals] [--model opus] [--concurrency 3]
```

For each ticket, the runner:

1. copies `app/` to a temporary folder, links this package into it, runs `alveolus-claude install` and commits;
2. runs `/alveolus-design tickets/<ticket>.md` in a non-interactive session, capped at 25 dollars;
3. runs `design check` on the design written in `docs/designs/`;
4. runs the judge in the same folder, read-only, with `rubric.md`, capped at 5 dollars.

The temporary folders stay, so a design can be read in its app: the runner prints where each one is.

## Read the results

The judge is a model too: its scores move from one run to the next. Compare the means over the six tickets and read the problems it lists, not one score. The check, the cost, the time and the number of subagents are measured, not judged.

`results/baseline/` holds the scores of the single-agent skill that writes the design from its template, the baseline any other way of designing must beat.
