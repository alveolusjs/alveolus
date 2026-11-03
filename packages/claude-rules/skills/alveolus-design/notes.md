# Design notes

Several agents design a story together, each on its own part, under `alveolus-designer`. They share one work folder, and each writes only its own notes file. `alveolus-claude design assemble` then puts the notes into the skeleton of the design, in the order of the template.

## The work folder

`docs/designs/.work/<slug>/`:

| File | Written by | Holds |
| --- | --- | --- |
| `brief.md` | alveolus-designer | The ticket, its type, its language, the bounded contexts and their style, the team, what each agent must look at |
| `skeleton.md` | alveolus-designer | The design to fill: frontmatter, headings in the language of the story, and one `<!-- slot: <key> -->` per place to fill |
| `<agent>.md` | each agent | Its notes: `analyst.md`, `explorer.md`, `strategist.md`, `modeler.md`, `integrator.md`, `architect.md`, `tester.md`, `operator.md`, `designer.md` |
| `critic.md` | alveolus-design-critic | Its findings on the assembled design |

## Your notes file

It has two parts.

1. **Working notes**, from the top to the first slot: what the agents after you need and the design does not show. The explorer's map of the code, the architect's list of files, your reasons. Nothing here reaches the design.
2. **Slots**: each starts with `<!-- slot: <key> -->` alone on its line, and holds the markdown that goes there, up to the next slot. Write only the slots your agent file lists, in the language of the story, as the help comments of `.claude/skills/alveolus-design/template.md` ask for that section. Never write the `## n.` heading of a section: the skeleton has it. Do write the `###` headings inside a section when the template has them.

A slot you have nothing for: leave it out. The assembly writes "None." in the language of the story.

## Rows that any agent adds

Some slots are table rows that every agent may add. Write the rows only, with no header, in these columns:

| Slot | Columns |
| --- | --- |
| `decisions` | `\| D-<tag><n> \| Decision \| Why \| Rejected alternative \| ADR-<tag><n> or empty \|` |
| `questions.business`, `questions.tech`, `questions.rules` | `\| Q-<tag><n> \| Question \| Assumption meanwhile \| Blocks \|` |
| `rules` | `\| RULE-CODE \| Where \| How \|` |
| `waivers` | `\| W-<tag><n> \| Rule \| Reason \| What limits the risk \| ADR-<tag><n> or empty \|` |
| `adrs` | `\| ADR-<tag><n> \| Decision \| Rules \| Depends on \|` |
| `requests` | `\| To \| What to change \| Why \|` (never assembled: for alveolus-designer) |

A decision always has a reason, and a rejected alternative whenever another choice was reasonable. A question always has the assumption you design on meanwhile, and what it blocks: a decision, an AC, an increment. Cite in `rules` each Alveolus rule you applied, where, and how.

## Identifiers

- **Decisions, questions, waivers and ADRs** take a local id: the letter of your agent, then a number. `D-M1`, `Q-M2`, `W-M1`, `ADR-M1`. The assembly renumbers them `D-1`, `Q-1`... across the design, and rewrites every place that cites them. To cite another agent's decision, use its local id, as its notes write it.
- **Acceptance criteria** (`AC-n`, analyst), **invariants** (`INV-n`, modeler), **tests** (`T-n`, tester) and **increments** (`In`, designer) are numbered by their only author, with no letter.
- **Model elements** are `Prefix:Name`, defined once, by their owner: `AGG:`, `VO:`, `ERR:` (modeler, section 7), `EVT:` (modeler, section 8), `UC:`, `QRY:` (architect, section 9), `API:` (architect, section 10), `TBL:` (architect, section 11). Others cite them.

| Agent | Letter |
| --- | --- |
| analyst | A |
| explorer | X |
| strategist | S |
| modeler | M |
| integrator | N |
| architect | R |
| tester | T |
| operator | O |
| designer | Z |

## Boundaries

- Write only your notes file. Never edit the design, the skeleton, or the notes of another agent.
- Never overrule an earlier agent. When your part needs a change upstream, add a row to `requests`, and design on what is written meanwhile.
- Settle no business behaviour the ticket does not state. Ask a question, with the assumption you design on.
- Before deciding, read whole the rules file of your part, for the style of each bounded context you design: `.claude/alveolus/design/<style>/<part>.md`. A deviation is a waiver, never a silent choice.
- Use the names of the glossary (section 6.3) and of the model (section 7), as the strategist and the modeler wrote them. One concept, one name, everywhere.

## When you are done

Reply in five lines at most: what you decided, the questions and requests you raised, the path of your notes. Everything else is in your notes.
